from datetime import date
from typing import Any, Dict, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.transaction import TransactionRead
from app.schemas.recurring_bill import (
    RecurringBillCreate,
    RecurringBillUpdate,
    RecurringBillPostPaymentRequest,
    RecurringBillResponse,
    RecurringBillListResponse,
)
from app.services.recurring_bill_service import RecurringBillService

router = APIRouter(prefix="/recurring-bills", tags=["Recurring Bills"])


def _to_bill_response(bill, db: Session) -> RecurringBillResponse:
    today = date.today()
    is_overdue = (bill.status == "active" and bill.next_due_date < today)
    days_until_due = (bill.next_due_date - today).days
    account_name = None
    if bill.account_id:
        from app.models.account import Account
        acc = db.query(Account).filter(Account.id == bill.account_id).first()
        if acc:
            account_name = acc.name

    return RecurringBillResponse(
        id=bill.id,
        user_id=bill.user_id,
        account_id=bill.account_id,
        account_name=account_name,
        name=bill.name,
        merchant=bill.merchant,
        category=bill.category,
        amount=bill.amount,
        frequency=bill.frequency,
        start_date=bill.start_date,
        end_date=bill.end_date,
        next_due_date=bill.next_due_date,
        status=bill.status,
        auto_post=bill.auto_post,
        last_posted_date=bill.last_posted_date,
        reminder_days_before=bill.reminder_days_before,
        is_overdue=is_overdue,
        days_until_due=days_until_due,
        created_at=bill.created_at,
        updated_at=bill.updated_at,
    )


@router.post(
    "",
    response_model=RecurringBillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new recurring bill / subscription",
)
def create_recurring_bill(
    payload: RecurringBillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill = RecurringBillService.create_recurring_bill(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )
    return _to_bill_response(bill, db)


@router.get(
    "",
    response_model=RecurringBillListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all recurring bills for current user",
)
def list_recurring_bills(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (active, paused, cancelled)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return RecurringBillService.list_recurring_bills(
        db=db,
        user_id=current_user.id,
        status_filter=status_filter,
    )


@router.get(
    "/{bill_id}",
    response_model=RecurringBillResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single recurring bill by ID",
)
def get_recurring_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill = RecurringBillService.get_recurring_bill(
        db=db,
        user_id=current_user.id,
        bill_id=bill_id,
    )
    return _to_bill_response(bill, db)


@router.put(
    "/{bill_id}",
    response_model=RecurringBillResponse,
    status_code=status.HTTP_200_OK,
    summary="Update an existing recurring bill",
)
def update_recurring_bill(
    bill_id: uuid.UUID,
    payload: RecurringBillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill = RecurringBillService.update_recurring_bill(
        db=db,
        user_id=current_user.id,
        bill_id=bill_id,
        payload=payload,
    )
    return _to_bill_response(bill, db)


@router.post(
    "/{bill_id}/pause",
    response_model=RecurringBillResponse,
    status_code=status.HTTP_200_OK,
    summary="Pause a recurring bill",
)
def pause_recurring_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill = RecurringBillService.toggle_status(
        db=db,
        user_id=current_user.id,
        bill_id=bill_id,
        new_status="paused",
    )
    return _to_bill_response(bill, db)


@router.post(
    "/{bill_id}/resume",
    response_model=RecurringBillResponse,
    status_code=status.HTTP_200_OK,
    summary="Resume a paused recurring bill",
)
def resume_recurring_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill = RecurringBillService.toggle_status(
        db=db,
        user_id=current_user.id,
        bill_id=bill_id,
        new_status="active",
    )
    return _to_bill_response(bill, db)


@router.post(
    "/{bill_id}/post-payment",
    status_code=status.HTTP_200_OK,
    summary="Post payment transaction for recurring bill",
)
def post_bill_payment(
    bill_id: uuid.UUID,
    payload: RecurringBillPostPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction, bill = RecurringBillService.post_bill_payment(
        db=db,
        user_id=current_user.id,
        bill_id=bill_id,
        payload=payload,
    )
    return {
        "message": f"Payment of ${transaction.amount:,.2f} for '{bill.name}' posted successfully.",
        "transaction": TransactionRead.model_validate(transaction),
        "bill": _to_bill_response(bill, db),
    }


@router.delete(
    "/{bill_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete recurring bill",
)
def delete_recurring_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    RecurringBillService.delete_recurring_bill(
        db=db,
        user_id=current_user.id,
        bill_id=bill_id,
    )
    return MessageResponse(message="Recurring bill deleted successfully. Historical transactions are preserved.")
