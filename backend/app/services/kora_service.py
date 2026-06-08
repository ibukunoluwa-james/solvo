"""
Kora API Service — transport layer for Kora (Korapay) payment infrastructure.

Implements the real Kora Payout API:
    - Single payout:   POST {base}/transactions/disburse
    - Bulk payout:     POST {base}/transactions/disburse/bulk
    - Verify payout:   GET  {base}/transactions/{reference}
    - Balances:        GET  {base}/balances
    - Webhook verify:  HMAC-SHA256 of the `data` object, signed with the secret key

`settings.kora_api_base_url` already includes the `/merchant/api/v1` prefix, so
endpoints below are appended directly.

Design:
    - MOCK_MODE (settings.kora_mock_mode): return simulated successful responses
      so the full payroll/advance flow works locally without credentials.
    - Real payouts are asynchronous: Kora accepts the request (status
      "processing"/"pending") and the final outcome arrives via webhook. So the
      service reports "processing" on accept and lets the webhook settle it.
    - Bulk has constraints (one currency per batch, 2-50 payouts), so
      initiate_bulk_payout groups transfers by currency and falls back to a
      single payout for any currency group with only one transfer.

Docs: https://developers.korapay.com/docs/payout-via-api
      https://developers.korapay.com/docs/bulk-payouts-via-api
      https://developers.korapay.com/docs/webhooks
"""

import hashlib
import hmac
import json
import logging
import uuid
from dataclasses import dataclass

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Currencies Kora supports for bank-account payouts.
SUPPORTED_CURRENCIES = {"NGN", "KES", "GHS", "ZAR", "XOF", "XAF", "EGP", "USD"}

# Default mobile-money operator slug per currency (Kora "List MMO" slugs).
MOBILE_OPERATOR_BY_CURRENCY = {
    "KES": "safaricom-ke",
    "GHS": "mtn-gh",
}


@dataclass
class KoraTransfer:
    """
    A single payout request. Set bank fields for a bank transfer, or
    mobile_number for a mobile-money payout (operator is inferred from the
    currency when not given).
    """
    reference: str
    amount: float
    currency: str
    account_name: str
    narration: str
    email: str = ""  # Kora requires destination.customer.email
    # bank-account rail
    bank_account: str = ""
    bank_code: str = ""
    # mobile-money rail
    mobile_number: str = ""
    mobile_operator: str = ""

    @property
    def is_mobile_money(self) -> bool:
        return bool(self.mobile_number) and not (self.bank_account and self.bank_code)


@dataclass
class KoraTransferResponse:
    """Normalized response from a Kora transfer initiation or status check."""
    reference: str
    kora_reference: str
    status: str  # "processing", "success", "failed"
    message: str


@dataclass
class KoraBatchResponse:
    """Response from a bulk payout initiation."""
    batch_id: str
    total_transfers: int
    status: str
    transfers: list[KoraTransferResponse]


class KoraError(Exception):
    """Raised on transport/credential failures talking to Kora."""


class KoraService:
    """Client for the Kora (Korapay) Payout API."""

    def __init__(self):
        self.base_url = settings.kora_api_base_url.rstrip("/")
        self.api_key = settings.kora_api_key
        self.encryption_key = settings.kora_encryption_key
        self.mock_mode = settings.kora_mock_mode

    # ── helpers ──

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _email_for(transfer: KoraTransfer) -> str:
        """Kora requires a customer email; synthesize a stable one if absent."""
        return transfer.email or f"payouts+{transfer.reference}@solvo.africa"

    @staticmethod
    def _normalize_msisdn(number: str) -> str:
        """Kora expects digits only, no '+' or spaces (e.g. 254712345678)."""
        return number.replace("+", "").replace(" ", "").strip()

    def _build_destination(self, transfer: KoraTransfer) -> dict:
        """Build the `destination` object for a single payout (bank or mobile)."""
        customer = {"name": transfer.account_name, "email": self._email_for(transfer)}
        if transfer.is_mobile_money:
            operator = (
                transfer.mobile_operator
                or MOBILE_OPERATOR_BY_CURRENCY.get(transfer.currency, "")
            )
            return {
                "type": "mobile_money",
                "amount": round(transfer.amount, 2),
                "currency": transfer.currency,
                "narration": transfer.narration,
                "mobile_money": {
                    "operator": operator,
                    "mobile_number": self._normalize_msisdn(transfer.mobile_number),
                },
                "customer": customer,
            }
        return {
            "type": "bank_account",
            "amount": round(transfer.amount, 2),
            "currency": transfer.currency,
            "narration": transfer.narration,
            "bank_account": {
                "bank": transfer.bank_code,
                "account": transfer.bank_account,
            },
            "customer": customer,
        }

    @staticmethod
    def _error_message(body: dict, status_code: int) -> str:
        """
        Build a human-readable error from a Kora failure body, including
        field-level validation messages (e.g. 422 validation_error returns
        data = {"destination.customer.email": {"message": "..."}}).
        """
        msg = body.get("message") or f"HTTP {status_code}"
        data = body.get("data")
        if isinstance(data, dict):
            details = [
                f"{field}: {info['message']}"
                for field, info in data.items()
                if isinstance(info, dict) and "message" in info
            ]
            if details:
                msg = f"{msg} — {'; '.join(details)}"
        return msg

    def _parse_single(self, resp: httpx.Response, reference: str) -> KoraTransferResponse:
        """Map a single-payout / verify HTTP response to KoraTransferResponse."""
        try:
            body = resp.json()
        except ValueError:
            body = {}

        if resp.status_code >= 400 or not body.get("status", False):
            message = self._error_message(body, resp.status_code)
            logger.error("Kora payout %s rejected (HTTP %s): %s", reference, resp.status_code, message)
            return KoraTransferResponse(reference, "", "failed", message)

        data = body.get("data", {})
        return KoraTransferResponse(
            reference=reference,
            kora_reference=data.get("reference", reference),
            status=data.get("status", "processing"),
            message=data.get("message") or body.get("message", ""),
        )

    # ── Single Transfer ──

    async def initiate_transfer(self, transfer: KoraTransfer) -> KoraTransferResponse:
        """Initiate a single bank-account payout via Kora."""
        if self.mock_mode:
            return self._mock_transfer(transfer)

        payload = {
            "reference": transfer.reference,
            "destination": self._build_destination(transfer),
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/transactions/disburse",
                    json=payload,
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            logger.error("Kora transport error for %s: %s", transfer.reference, exc)
            return KoraTransferResponse(transfer.reference, "", "failed", str(exc))

        return self._parse_single(resp, transfer.reference)

    # ── Bulk Payout ──

    async def initiate_bulk_payout(
        self, transfers: list[KoraTransfer]
    ) -> KoraBatchResponse:
        """
        Disburse multiple payouts by fanning out concurrent single-payout calls.

        We deliberately do NOT use Kora's /disburse/bulk endpoint: it requires
        per-account activation and otherwise rejects every request with a
        misleading "unsafe characters" validation error. Single payouts work for
        all rails/currencies and Kora processes them in parallel on their side.
        """
        if self.mock_mode:
            return self._mock_bulk(transfers)

        import asyncio
        results = list(
            await asyncio.gather(*(self.initiate_transfer(t) for t in transfers))
        )

        statuses = {r.status for r in results}
        if statuses <= {"success", "completed"}:
            batch_status = "completed"
        elif statuses == {"failed"}:
            batch_status = "failed"
        else:
            batch_status = "processing"

        return KoraBatchResponse(
            batch_id=f"solvobatch{uuid.uuid4().hex[:12]}",
            total_transfers=len(transfers),
            status=batch_status,
            transfers=results,
        )

    # ── Status Check ──

    async def get_transfer_status(self, reference: str) -> KoraTransferResponse:
        """Verify the status of a previously initiated payout by reference."""
        if self.mock_mode:
            return KoraTransferResponse(
                reference=reference,
                kora_reference=f"kora_{reference}",
                status="success",
                message="Transfer completed (mock)",
            )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(
                    f"{self.base_url}/transactions/{reference}",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            logger.error("Kora status transport error for %s: %s", reference, exc)
            return KoraTransferResponse(reference, "", "failed", str(exc))

        return self._parse_single(resp, reference)

    # ── Balances ──

    async def get_balances(self) -> dict:
        """
        Return Kora balances per currency:
        {"NGN": {"available_balance": ..., "pending_balance": ...}, ...}
        """
        if self.mock_mode:
            return {
                "NGN": {"available_balance": 5_000_000.00, "pending_balance": 0.00},
                "KES": {"available_balance": 1_200_000.00, "pending_balance": 0.00},
                "GHS": {"available_balance": 250_000.00, "pending_balance": 0.00},
            }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(
                    f"{self.base_url}/balances", headers=self._headers()
                )
                resp.raise_for_status()
                return resp.json().get("data", {})
        except httpx.HTTPError as exc:
            logger.error("Kora balance fetch failed: %s", exc)
            raise KoraError(str(exc)) from exc

    # ── Pay-in (fund the wallet) ──

    async def initiate_charge(
        self,
        reference: str,
        amount: float,
        currency: str,
        customer_name: str,
        customer_email: str,
        narration: str = "Wallet top-up",
        auto_complete: bool = True,
    ) -> dict:
        """
        Create a bank-transfer charge (pay-in) that credits the merchant
        balance. Returns the virtual account to pay into and the charge status.

        `auto_complete=True` is a sandbox convenience that auto-settles the
        charge (otherwise sandbox auto-completes after ~2 minutes). Raises
        KoraError on failure. Bank-transfer collection is NGN-only on Kora.
        """
        if self.mock_mode:
            return {
                "reference": reference,
                "status": "success",
                "amount": round(amount, 2),
                "amount_expected": round(amount, 2),
                "currency": currency,
                "fee": 0,
                "pay_to": {
                    "account_number": "0000000000",
                    "bank_name": "Mock Bank",
                    "account_name": "Solvo Mock Wallet",
                    "expiry_date_in_utc": None,
                },
                "message": "Mock funding completed",
                "mock": True,
            }

        payload = {
            "reference": reference,
            "amount": round(amount, 2),
            "currency": currency,
            "customer": {"name": customer_name, "email": customer_email},
            "narration": narration,
            "merchant_bears_cost": True,
            "auto_complete": auto_complete,
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/charges/bank-transfer",
                    json=payload,
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            logger.error("Kora charge transport error for %s: %s", reference, exc)
            raise KoraError(str(exc)) from exc

        try:
            body = resp.json()
        except ValueError:
            body = {}
        if resp.status_code >= 400 or not body.get("status", False):
            raise KoraError(self._error_message(body, resp.status_code))

        data = body.get("data", {})
        ba = data.get("bank_account", {}) or {}
        return {
            "reference": data.get("reference", reference),
            "status": data.get("status", "processing"),
            "amount": data.get("amount"),
            "amount_expected": data.get("amount_expected"),
            "currency": data.get("currency", currency),
            "fee": data.get("fee"),
            "pay_to": {
                "account_number": ba.get("account_number"),
                "bank_name": ba.get("bank_name"),
                "account_name": ba.get("account_name"),
                "expiry_date_in_utc": ba.get("expiry_date_in_utc"),
            },
            "message": body.get("message", ""),
        }

    async def get_charge_status(self, reference: str) -> dict:
        """Look up a pay-in charge by reference (status, amount_paid, etc.)."""
        if self.mock_mode:
            return {"reference": reference, "status": "success", "amount_paid": None}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(
                    f"{self.base_url}/charges/{reference}", headers=self._headers()
                )
        except httpx.HTTPError as exc:
            raise KoraError(str(exc)) from exc

        try:
            body = resp.json()
        except ValueError:
            body = {}
        if resp.status_code >= 400 or not body.get("status", False):
            raise KoraError(self._error_message(body, resp.status_code))
        return body.get("data", {})

    def _encrypt_charge_data(self, payload: dict) -> str:
        """
        AES-256-GCM encrypt a charge payload with the encryption key, formatted
        as Kora expects: hex `iv:ciphertext:authTag`.
        """
        import os
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM

        iv = os.urandom(16)
        sealed = AESGCM(self.encryption_key.encode()).encrypt(
            iv, json.dumps(payload).encode(), None
        )
        ciphertext, tag = sealed[:-16], sealed[-16:]
        return f"{iv.hex()}:{ciphertext.hex()}:{tag.hex()}"

    async def charge_card(
        self,
        reference: str,
        amount: float,
        currency: str,
        card_number: str,
        cvv: str,
        expiry_month: str,
        expiry_year: str,
        customer_name: str,
        customer_email: str,
    ) -> dict:
        """
        Charge a card (encrypted) to fund the merchant balance. Credits
        immediately for no-auth cards. Card API is NGN-only on Kora.
        (The card charge endpoint does not accept a narration field.)
        """
        if self.mock_mode:
            return {
                "reference": reference,
                "status": "success",
                "amount": round(amount, 2),
                "currency": currency,
                "fee": 0,
                "message": "Mock card charge completed",
                "mock": True,
            }

        plain = {
            "reference": reference,
            "card": {
                "number": card_number,
                "cvv": cvv,
                "expiry_month": expiry_month,
                "expiry_year": expiry_year,
            },
            "amount": round(amount, 2),
            "currency": currency,
            "customer": {"name": customer_name, "email": customer_email},
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/charges/card",
                    json={"charge_data": self._encrypt_charge_data(plain)},
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            logger.error("Kora card charge transport error for %s: %s", reference, exc)
            raise KoraError(str(exc)) from exc

        try:
            body = resp.json()
        except ValueError:
            body = {}
        if resp.status_code >= 400 or not body.get("status", False):
            raise KoraError(self._error_message(body, resp.status_code))

        data = body.get("data", {})
        return {
            "reference": data.get("payment_reference", reference),
            "status": data.get("status", "processing"),
            "amount": data.get("amount"),
            "currency": data.get("currency", currency),
            "fee": data.get("fee"),
            "auth_model": data.get("auth_model"),
            "message": data.get("response_message") or body.get("message", ""),
        }

    # ── Webhook signature ──

    def verify_webhook_signature(self, data_object: dict, signature: str) -> bool:
        """
        Kora signs the `data` object of the webhook payload with HMAC-SHA256
        using your secret key, sent in the `x-korapay-signature` header.

        The signed string is the compact JSON of the data object (no spaces),
        preserving key order as received.
        """
        if not signature or not self.api_key:
            return False
        serialized = json.dumps(data_object, separators=(",", ":")).encode()
        expected = hmac.new(
            self.api_key.encode(), serialized, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    # ── Mock Helpers ──

    def _mock_transfer(self, transfer: KoraTransfer) -> KoraTransferResponse:
        logger.info(
            "[MOCK] Transfer: %s %s → %s (%s)",
            transfer.amount, transfer.currency, transfer.bank_account,
            transfer.account_name,
        )
        return KoraTransferResponse(
            reference=transfer.reference,
            kora_reference=f"kora_mock_{uuid.uuid4().hex[:8]}",
            status="success",
            message="Mock transfer completed successfully",
        )

    def _mock_bulk(self, transfers: list[KoraTransfer]) -> KoraBatchResponse:
        results = [self._mock_transfer(t) for t in transfers]
        batch_id = f"mock_batch_{uuid.uuid4().hex[:8]}"
        logger.info("[MOCK] Bulk payout: %d transfers, batch=%s", len(transfers), batch_id)
        return KoraBatchResponse(
            batch_id=batch_id,
            total_transfers=len(transfers),
            status="completed",
            transfers=results,
        )
