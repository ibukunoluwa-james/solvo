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
from collections import defaultdict
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

    def _parse_single(self, resp: httpx.Response, reference: str) -> KoraTransferResponse:
        """Map a single-payout / verify HTTP response to KoraTransferResponse."""
        try:
            body = resp.json()
        except ValueError:
            body = {}

        if resp.status_code >= 400 or not body.get("status", False):
            message = body.get("message") or f"HTTP {resp.status_code}"
            logger.error("Kora payout %s rejected: %s", reference, message)
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
        Process multiple transfers. Kora's bulk endpoint requires a single
        currency per batch and 2-50 payouts, so we group by currency and use
        the bulk endpoint per group (falling back to a single payout when a
        currency group has only one transfer).
        """
        if self.mock_mode:
            return self._mock_bulk(transfers)

        results: list[KoraTransferResponse] = []
        batch_ids: list[str] = []

        # Mobile-money payouts go one-by-one (Kora's bulk endpoint is bank-only).
        bank_transfers = [t for t in transfers if not t.is_mobile_money]
        for t in transfers:
            if t.is_mobile_money:
                results.append(await self.initiate_transfer(t))

        groups: dict[str, list[KoraTransfer]] = defaultdict(list)
        for t in bank_transfers:
            groups[t.currency].append(t)

        for currency, group in groups.items():
            if len(group) == 1:
                results.append(await self.initiate_transfer(group[0]))
                continue

            batch_ref = f"solvo_batch_{uuid.uuid4().hex[:12]}"
            payload = {
                "batch_reference": batch_ref,
                "currency": currency,
                "description": "Solvo payroll disbursement",
                "merchant_bears_cost": False,
                "payouts": [
                    {
                        "reference": t.reference,
                        "amount": round(t.amount, 2),
                        "type": "bank_account",
                        "narration": t.narration,
                        "bank_account": {
                            "bank_code": t.bank_code,
                            "account_number": t.bank_account,
                        },
                        "customer": {
                            "name": t.account_name,
                            "email": self._email_for(t),
                        },
                    }
                    for t in group
                ],
            }

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/transactions/disburse/bulk",
                        json=payload,
                        headers=self._headers(),
                    )
                results.extend(self._parse_bulk_group(resp, group))
                batch_ids.append(batch_ref)
            except httpx.HTTPError as exc:
                logger.error("Kora bulk transport error (%s): %s", currency, exc)
                results.extend(
                    KoraTransferResponse(t.reference, "", "failed", str(exc))
                    for t in group
                )

        return KoraBatchResponse(
            batch_id=";".join(batch_ids) or f"batch_{uuid.uuid4().hex[:8]}",
            total_transfers=len(transfers),
            status="processing",
            transfers=results,
        )

    def _parse_bulk_group(
        self, resp: httpx.Response, group: list[KoraTransfer]
    ) -> list[KoraTransferResponse]:
        """
        The bulk endpoint returns a batch-level result, not per-payout statuses.
        On acceptance, each payout is queued ("processing") and its final state
        arrives via webhook (keyed on the payout reference). On rejection, the
        whole group fails.
        """
        try:
            body = resp.json()
        except ValueError:
            body = {}

        if resp.status_code >= 400 or not body.get("status", False):
            message = body.get("message") or f"HTTP {resp.status_code}"
            logger.error("Kora bulk batch rejected: %s", message)
            return [KoraTransferResponse(t.reference, "", "failed", message) for t in group]

        return [
            KoraTransferResponse(t.reference, t.reference, "processing", "Queued in batch")
            for t in group
        ]

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
