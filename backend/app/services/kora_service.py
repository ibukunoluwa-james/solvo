"""
Kora API Service — Abstraction layer for Kora payment infrastructure.

Design decisions:
    1. MOCK_MODE: When kora_mock_mode=true (default for dev), all API calls
       return simulated successful responses. This lets the full payroll flow
       work locally without real Kora credentials.

    2. Async httpx: All real API calls are non-blocking so we can process
       bulk payouts without holding up the event loop.

    3. Single responsibility: This service only handles HTTP transport to
       Kora. Business logic (eligibility, validation) lives in
       payroll_service.py and advance_service.py.

    Kora API reference:
    - Bulk Payout: POST /merchant/api/v1/transactions/disburse
    - Single Transfer: POST /merchant/api/v1/transactions/disburse
    - Status: GET /merchant/api/v1/transactions/{reference}
"""

import uuid
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class KoraTransfer:
    """Single transfer request payload."""
    reference: str
    amount: float
    currency: str
    bank_account: str
    bank_code: str
    account_name: str
    narration: str


@dataclass
class KoraTransferResponse:
    """Response from a Kora transfer initiation."""
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


class KoraService:
    """Client for interacting with the Kora Pay API."""

    def __init__(self):
        self.base_url = settings.kora_api_base_url
        self.api_key = settings.kora_api_key
        self.mock_mode = settings.kora_mock_mode

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ── Single Transfer ──

    async def initiate_transfer(self, transfer: KoraTransfer) -> KoraTransferResponse:
        """Initiate a single bank transfer via Kora."""
        if self.mock_mode:
            return self._mock_transfer(transfer)

        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "reference": transfer.reference,
                "destination": {
                    "type": "bank_account",
                    "amount": transfer.amount,
                    "currency": transfer.currency,
                    "bank_account": {
                        "bank": transfer.bank_code,
                        "account": transfer.bank_account,
                        "account_name": transfer.account_name,
                    },
                    "narration": transfer.narration,
                },
            }

            response = await client.post(
                f"{self.base_url}/transactions/disburse",
                json=payload,
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

            return KoraTransferResponse(
                reference=transfer.reference,
                kora_reference=data.get("data", {}).get("reference", ""),
                status=data.get("data", {}).get("status", "processing"),
                message=data.get("message", ""),
            )

    # ── Bulk Payout ──

    async def initiate_bulk_payout(
        self, transfers: list[KoraTransfer]
    ) -> KoraBatchResponse:
        """
        Process multiple transfers as a bulk payout.

        Note: Kora's actual bulk endpoint may batch these server-side.
        For now we iterate and call single transfers, which Kora
        processes in parallel on their end. A true batch endpoint
        can be swapped in when available.
        """
        if self.mock_mode:
            return self._mock_bulk(transfers)

        results = []
        for transfer in transfers:
            try:
                result = await self.initiate_transfer(transfer)
                results.append(result)
            except httpx.HTTPStatusError as e:
                logger.error(f"Kora transfer failed for {transfer.reference}: {e}")
                results.append(KoraTransferResponse(
                    reference=transfer.reference,
                    kora_reference="",
                    status="failed",
                    message=str(e),
                ))

        batch_id = f"batch_{uuid.uuid4().hex[:12]}"
        return KoraBatchResponse(
            batch_id=batch_id,
            total_transfers=len(transfers),
            status="processing",
            transfers=results,
        )

    # ── Status Check ──

    async def get_transfer_status(self, reference: str) -> KoraTransferResponse:
        """Check the status of a previously initiated transfer."""
        if self.mock_mode:
            return KoraTransferResponse(
                reference=reference,
                kora_reference=f"kora_{reference}",
                status="success",
                message="Transfer completed (mock)",
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/transactions/{reference}",
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

            return KoraTransferResponse(
                reference=reference,
                kora_reference=data.get("data", {}).get("reference", ""),
                status=data.get("data", {}).get("status", "unknown"),
                message=data.get("message", ""),
            )

    # ── Mock Helpers ──

    def _mock_transfer(self, transfer: KoraTransfer) -> KoraTransferResponse:
        logger.info(
            f"[MOCK] Transfer: {transfer.amount} {transfer.currency} → "
            f"{transfer.bank_account} ({transfer.account_name})"
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
        logger.info(
            f"[MOCK] Bulk payout: {len(transfers)} transfers, batch={batch_id}"
        )
        return KoraBatchResponse(
            batch_id=batch_id,
            total_transfers=len(transfers),
            status="completed",
            transfers=results,
        )
