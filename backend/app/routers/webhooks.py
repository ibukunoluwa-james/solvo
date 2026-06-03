from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.models.payroll import PayrollEntry, PayrollEntryStatus
from app.models.advance import AdvanceRequest, AdvanceStatus
from app.config import settings

router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

# Basic signature verification (placeholder for Kora's specific webhook signature logic)
def verify_kora_signature(request: Request):
    signature = request.headers.get("x-kora-signature")
    # In a real implementation, you would hash the request body with KORA_ENCRYPTION_KEY
    # and compare it to the signature. For mock mode / hackathon, we can bypass if mock mode is true.
    if not settings.kora_mock_mode and not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    return True

@router.post("/kora")
async def kora_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _valid: bool = Depends(verify_kora_signature),
):
    """
    Handle Kora async transaction webhooks.
    When a transfer succeeds or fails, Kora hits this endpoint.
    """
    payload = await request.json()
    logger.info(f"Received Kora webhook: {payload}")

    event_type = payload.get("event")
    data = payload.get("data", {})
    reference = data.get("reference")
    tx_status = data.get("status")  # 'success', 'failed'

    if not reference or not tx_status:
        return {"status": "ignored", "reason": "missing reference or status"}

    if event_type == "transfer.success" or tx_status == "success":
        new_status = "settled"
    elif event_type == "transfer.failed" or tx_status == "failed":
        new_status = "failed"
    else:
        new_status = "processing"

    if new_status in ["settled", "failed"]:
        # Update PayrollEntry
        from sqlalchemy import select
        
        entry_result = await db.execute(select(PayrollEntry).where(PayrollEntry.kora_transfer_id == reference))
        entry = entry_result.scalar_one_or_none()
        
        if entry:
            entry.status = PayrollEntryStatus.settled if new_status == "settled" else PayrollEntryStatus.failed
            await db.commit()
            return {"status": "ok", "updated": "payroll_entry", "id": str(entry.id)}

        # Update AdvanceRequest
        advance_result = await db.execute(select(AdvanceRequest).where(AdvanceRequest.kora_transfer_id == reference))
        advance = advance_result.scalar_one_or_none()
        
        if advance:
            advance.status = AdvanceStatus.disbursed if new_status == "settled" else AdvanceStatus.approved
            await db.commit()
            return {"status": "ok", "updated": "advance_request", "id": str(advance.id)}

    return {"status": "ignored", "reason": "not found or status unchanged"}
