import calendar
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.recurring_bill import RecurringBill
from app.models.notification import Notification
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.recurring_bill import (
    RecurringBillCreate,
    RecurringBillUpdate,
    RecurringBillPostPaymentRequest,
    RecurringBillResponse,
    RecurringBillListResponse,
)


def advance_recurrence_date(current_date: date, frequency: str, anchor_day: Optional[int] = None) -> date:
    """
    Computes the next recurrence date from current_date based on frequency,
    correctly clamping month-end days (e.g. Jan 31 -> Feb 28/29 -> Mar 31).
    """
    target_day = anchor_day if anchor_day is not None else current_date.day
    freq = frequency.lower().strip()
    
    if freq == "daily":
        return current_date + timedelta(days=1)
    elif freq == "weekly":
        return current_date + timedelta(days=7)
    elif freq == "biweekly":
        return current_date + timedelta(days=14)
    elif freq == "monthly":
        year = current_date.year
        month = current_date.month + 1
        if month > 12:
            month = 1
            year += 1
        max_day = calendar.monthrange(year, month)[1]
        day = min(target_day, max_day)
        return date(year, month, day)
    elif freq == "quarterly":
        year = current_date.year
        month = current_date.month + 3
        while month > 12:
            month -= 12
            year += 1
        max_day = calendar.monthrange(year, month)[1]
        day = min(target_day, max_day)
        return date(year, month, day)
    elif freq == "semi_annual":
        year = current_date.year
        month = current_date.month + 6
        while month > 12:
            month -= 12
            year += 1
        max_day = calendar.monthrange(year, month)[1]
        day = min(target_day, max_day)
        return date(year, month, day)
    elif freq == "annual":
        year = current_date.year + 1
        month = current_date.month
        max_day = calendar.monthrange(year, month)[1]
        day = min(target_day, max_day)
        return date(year, month, day)
    else:
        return current_date + timedelta(days=30)


def calculate_initial_next_due_date(start_date: date, frequency: str, today: Optional[date] = None) -> date:
    """
    Determines the next upcoming due date from start_date relative to reference date (today).
    """
    if today is None:
        today = date.today()
    if start_date >= today:
        return start_date
    next_due = start_date
    anchor_day = start_date.day
    iterations = 0
    while next_due < today and iterations < 1000:
        next_due = advance_recurrence_date(next_due, frequency, anchor_day=anchor_day)
        iterations += 1
    return next_due


def calculate_monthly_equivalent(amount: Decimal, frequency: str) -> Decimal:
    """
    Normalizes a recurring amount to an estimated monthly commitment.
    """
    freq = frequency.lower().strip()
    amt = Decimal(str(amount))
    if freq == "daily":
        return (amt * Decimal("30.4167")).quantize(Decimal("0.01"))
    elif freq == "weekly":
        return (amt * Decimal("4.3333")).quantize(Decimal("0.01"))
    elif freq == "biweekly":
        return (amt * Decimal("2.1666")).quantize(Decimal("0.01"))
    elif freq == "monthly":
        return amt.quantize(Decimal("0.01"))
    elif freq == "quarterly":
        return (amt / Decimal("3")).quantize(Decimal("0.01"))
    elif freq == "semi_annual":
        return (amt / Decimal("6")).quantize(Decimal("0.01"))
    elif freq == "annual":
        return (amt / Decimal("12")).quantize(Decimal("0.01"))
    return amt.quantize(Decimal("0.01"))


class RecurringBillService:
    @staticmethod
    def create_recurring_bill(
        db: Session,
        user_id: uuid.UUID,
        payload: RecurringBillCreate,
    ) -> RecurringBill:
        """
        Creates a new recurring bill with calculated initial due date.
        Strictly verifies ownership of linked account if provided.
        """
        if payload.account_id:
            account = db.query(Account).filter(
                Account.id == payload.account_id,
                Account.user_id == user_id,
            ).first()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified linked account does not exist or does not belong to authenticated user.",
                )

        if payload.end_date and payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date cannot be earlier than start_date.",
            )

        initial_due = calculate_initial_next_due_date(payload.start_date, payload.frequency)

        bill = RecurringBill(
            id=uuid.uuid4(),
            user_id=user_id,
            account_id=payload.account_id,
            name=payload.name,
            merchant=payload.merchant,
            category=payload.category,
            amount=payload.amount,
            frequency=payload.frequency,
            start_date=payload.start_date,
            end_date=payload.end_date,
            next_due_date=initial_due,
            status="active",
            auto_post=payload.auto_post,
            reminder_days_before=payload.reminder_days_before,
        )

        db.add(bill)
        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def get_recurring_bill(
        db: Session,
        user_id: uuid.UUID,
        bill_id: uuid.UUID,
    ) -> RecurringBill:
        """
        Fetches single recurring bill by ID scoped to current user.
        """
        bill = db.query(RecurringBill).filter(
            RecurringBill.id == bill_id,
            RecurringBill.user_id == user_id,
        ).first()
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurring bill not found.",
            )
        return bill

    @staticmethod
    def list_recurring_bills(
        db: Session,
        user_id: uuid.UUID,
        status_filter: Optional[str] = None,
    ) -> RecurringBillListResponse:
        """
        Lists all recurring bills for the user with calculated status and monthly commitment totals.
        """
        query = db.query(RecurringBill).filter(RecurringBill.user_id == user_id)
        if status_filter:
            query = query.filter(RecurringBill.status == status_filter.lower().strip())

        bills = query.order_by(RecurringBill.next_due_date.asc(), RecurringBill.name.asc()).all()

        today = date.today()
        items: List[RecurringBillResponse] = []
        active_count = 0
        monthly_committed_total = Decimal("0.00")

        # Map accounts for account_name
        account_ids = [b.account_id for b in bills if b.account_id]
        accounts_map = {}
        if account_ids:
            accounts = db.query(Account).filter(Account.id.in_(account_ids)).all()
            accounts_map = {acc.id: acc.name for acc in accounts}

        for bill in bills:
            is_overdue = (bill.status == "active" and bill.next_due_date < today)
            days_until_due = (bill.next_due_date - today).days

            if bill.status == "active":
                active_count += 1
                monthly_committed_total += calculate_monthly_equivalent(bill.amount, bill.frequency)

            items.append(
                RecurringBillResponse(
                    id=bill.id,
                    user_id=bill.user_id,
                    account_id=bill.account_id,
                    account_name=accounts_map.get(bill.account_id),
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
            )

        return RecurringBillListResponse(
            items=items,
            total=len(items),
            active_count=active_count,
            monthly_committed_total=monthly_committed_total.quantize(Decimal("0.01")),
        )

    @staticmethod
    def update_recurring_bill(
        db: Session,
        user_id: uuid.UUID,
        bill_id: uuid.UUID,
        payload: RecurringBillUpdate,
    ) -> RecurringBill:
        """
        Updates an existing recurring bill with input validation and user isolation.
        """
        bill = RecurringBillService.get_recurring_bill(db, user_id, bill_id)

        if payload.account_id is not None:
            account = db.query(Account).filter(
                Account.id == payload.account_id,
                Account.user_id == user_id,
            ).first()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified linked account does not exist or does not belong to authenticated user.",
                )
            bill.account_id = payload.account_id

        if payload.name is not None:
            bill.name = payload.name
        if payload.merchant is not None:
            bill.merchant = payload.merchant
        if payload.category is not None:
            bill.category = payload.category
        if payload.amount is not None:
            bill.amount = payload.amount
        if payload.auto_post is not None:
            bill.auto_post = payload.auto_post
        if payload.reminder_days_before is not None:
            bill.reminder_days_before = payload.reminder_days_before
        if payload.status is not None:
            bill.status = payload.status

        # Date and recurrence updates
        recalculate_due = False
        if payload.start_date is not None:
            bill.start_date = payload.start_date
            recalculate_due = True
        if payload.frequency is not None:
            bill.frequency = payload.frequency
            recalculate_due = True
        if payload.end_date is not None:
            bill.end_date = payload.end_date

        if bill.end_date and bill.end_date < bill.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date cannot be earlier than start_date.",
            )

        if recalculate_due and bill.status == "active":
            bill.next_due_date = calculate_initial_next_due_date(bill.start_date, bill.frequency)

        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def toggle_status(
        db: Session,
        user_id: uuid.UUID,
        bill_id: uuid.UUID,
        new_status: str,
    ) -> RecurringBill:
        """
        Pauses or resumes a recurring bill.
        """
        bill = RecurringBillService.get_recurring_bill(db, user_id, bill_id)
        valid_statuses = {"active", "paused", "cancelled"}
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{new_status}'. Must be one of: {sorted(valid_statuses)}",
            )
        bill.status = new_status
        if new_status == "active" and bill.next_due_date < date.today():
            bill.next_due_date = calculate_initial_next_due_date(bill.start_date, bill.frequency)
        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def delete_recurring_bill(
        db: Session,
        user_id: uuid.UUID,
        bill_id: uuid.UUID,
    ) -> bool:
        """
        Deletes recurring bill rule. Preserves all historical transactions.
        """
        bill = RecurringBillService.get_recurring_bill(db, user_id, bill_id)
        db.delete(bill)
        db.commit()
        return True

    @staticmethod
    def post_bill_payment(
        db: Session,
        user_id: uuid.UUID,
        bill_id: uuid.UUID,
        payload: RecurringBillPostPaymentRequest,
    ) -> Tuple[Transaction, RecurringBill]:
        """
        Explicitly posts an actual financial Transaction for the due bill cycle.
        Safeguards:
        - Advances next_due_date deterministically.
        - Records last_posted_date.
        - Emits a real Notification record.
        - Adjusts account balance.
        """
        bill = RecurringBillService.get_recurring_bill(db, user_id, bill_id)

        target_account_id = payload.account_id or bill.account_id
        if not target_account_id:
            # Look for any active user account if none linked
            user_account = db.query(Account).filter(Account.user_id == user_id).first()
            if not user_account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot post payment: user has no accounts configured.",
                )
            target_account_id = user_account.id
        else:
            account = db.query(Account).filter(
                Account.id == target_account_id,
                Account.user_id == user_id,
            ).first()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified payment account does not exist or does not belong to authenticated user.",
                )

        payment_amount = payload.amount or bill.amount
        payment_date = payload.payment_date or date.today()
        trans_datetime = datetime.combine(payment_date, datetime.min.time())

        # Create Transaction
        transaction = Transaction(
            id=uuid.uuid4(),
            user_id=user_id,
            account_id=target_account_id,
            destination_account_id=None,
            amount=payment_amount,
            transaction_type="expense",
            category=bill.category,
            merchant=bill.merchant or bill.name,
            description=payload.notes or f"Recurring Bill: {bill.name}",
            reference=f"RECBILL-{str(bill.id)[:8]}-{bill.next_due_date.strftime('%Y%m%d')}",
            source="manual",
            transaction_date=trans_datetime,
        )
        db.add(transaction)

        # Update last_posted_date and advance next_due_date
        bill.last_posted_date = payment_date
        next_due = advance_recurrence_date(bill.next_due_date, bill.frequency, anchor_day=bill.start_date.day)

        if bill.end_date and next_due > bill.end_date:
            bill.status = "cancelled"
        bill.next_due_date = next_due

        # Emit Notification for bill payment confirmation
        notif = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=f"Bill Paid: {bill.name}",
            message=f"Payment of ${payment_amount:,.2f} for '{bill.name}' was posted successfully.",
            type="bill_paid",
            reference_id=f"bill:{bill.id}:paid:{payment_date.isoformat()}",
            is_read=False,
        )
        db.add(notif)

        db.commit()
        db.refresh(transaction)
        db.refresh(bill)
        return transaction, bill
