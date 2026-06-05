"""
Kora webhook receiver.

Kora delivers asynchronous payout outcomes here. Each request carries an
`x-korapay-signature` header — an HMAC-SHA256 of the payload's `data` object,
signed with our secret key. We verify it before trusting anything.

A webhook `data.reference` is the payout reference we sent, which we store as
`kora_transfer_id` on the PayrollEntry / AdvanceRequest — so we match on it.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.advance import AdvanceRequest, AdvanceStatus
from app.models.payroll import (
    PayrollEntry,
    PayrollEntryStatus,
    PayrollRun,
    PayrollRunStatus,
)
from app.services.kora_service import KoraService

router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

_kora = KoraService()


async def _reconcile_run_status(db: AsyncSession, run_id) -> None:
    """Recompute a payroll run's status from its entries' terminal states."""
    run = await db.get(PayrollRun, run_id)
    if not run or run.status not in (
        PayrollRunStatus.processing,
        PayrollRunStatus.completed,
    ):
        return

    result = await db.execute(
        select(PayrollEntry.status).where(PayrollEntry.payroll_run_id == run_id)
    )
    statuses = [row[0] for row in result.all()]
    if not statuses:
        return

    if all(s == PayrollEntryStatus.failed for s in statuses):
        run.status = PayrollRunStatus.failed
    elif any(s in (PayrollEntryStatus.pending, PayrollEntryStatus.processing) for s in statuses):
        run.status = PayrollRunStatus.processing
    else:
        run.status = PayrollRunStatus.completed
        from datetime import datetime, timezone
        if not run.completed_at:
            run.completed_at = datetime.now(timezone.utc)


@router.post("/kora")
async def kora_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Kora async transfer webhooks (transfer.success / transfer.failed)."""
    payload = await request.json()
    data = payload.get("data", {}) or {}
    event_type = payload.get("event")

    # ── Signature verification (skipped only in mock mode) ──
    if not settings.kora_mock_mode:
        signature = request.headers.get("x-korapay-signature", "")
        if not _kora.verify_webhook_signature(data, signature):
            logger.warning("Rejected Kora webhook: bad signature (event=%s)", event_type)
            raise HTTPException(status_code=401, detail="Invalid signature")

    reference = data.get("reference")
    tx_status = data.get("status")
    logger.info("Kora webhook: event=%s ref=%s status=%s", event_type, reference, tx_status)

    if not reference or not tx_status:
        return {"status": "ignored", "reason": "missing reference or status"}

    succeeded = event_type == "transfer.success" or tx_status == "success"
    failed = event_type == "transfer.failed" or tx_status == "failed"
    if not (succeeded or failed):
        return {"status": "ignored", "reason": "non-terminal status"}

    # ── Payroll entry? ──
    entry = await db.scalar(
        select(PayrollEntry).where(PayrollEntry.kora_transfer_id == reference)
    )
    if entry:
        entry.status = (
            PayrollEntryStatus.settled if succeeded else PayrollEntryStatus.failed
        )
        await _reconcile_run_status(db, entry.payroll_run_id)
        await db.commit()
        return {"status": "ok", "updated": "payroll_entry", "id": str(entry.id)}

    # ── Advance? ──
    advance = await db.scalar(
        select(AdvanceRequest).where(AdvanceRequest.kora_transfer_id == reference)
    )
    if advance:
        # On failure, leave it 'approved' so it can be retried (no 'failed' state).
        advance.status = AdvanceStatus.disbursed if succeeded else AdvanceStatus.approved
        await db.commit()
        return {"status": "ok", "updated": "advance_request", "id": str(advance.id)}

    return {"status": "ignored", "reason": "reference not found"}
