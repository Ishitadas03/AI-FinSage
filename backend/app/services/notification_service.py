from datetime import date, datetime, timezone
from typing import List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.notification import Notification
from app.models.recurring_bill import RecurringBill
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
)


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: uuid.UUID,
        payload: NotificationCreate,
    ) -> Notification:
        """
        Creates a new user-scoped notification.
        """
        notif = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=payload.title,
            message=payload.message,
            type=payload.type,
            reference_id=payload.reference_id,
            is_read=payload.is_read,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def list_notifications(
        db: Session,
        user_id: uuid.UUID,
        is_read: Optional[bool] = None,
        limit: int = 50,
    ) -> NotificationListResponse:
        """
        Lists notifications for user with unread counter and created_at sorting.
        """
        base_query = db.query(Notification).filter(Notification.user_id == user_id)
        unread_count = base_query.filter(Notification.is_read == False).count()  # noqa: E712

        query = base_query
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        total = query.count()
        items = query.order_by(Notification.created_at.desc()).limit(limit).all()

        response_items = [
            NotificationResponse(
                id=n.id,
                user_id=n.user_id,
                title=n.title,
                message=n.message,
                type=n.type,
                reference_id=n.reference_id,
                is_read=n.is_read,
                read_at=n.read_at,
                created_at=n.created_at,
            )
            for n in items
        ]

        return NotificationListResponse(
            items=response_items,
            total=total,
            unread_count=unread_count,
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> Notification:
        """
        Marks a specific notification as read.
        """
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        ).first()
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found.",
            )

        if not notif.is_read:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: uuid.UUID,
        notification_ids: Optional[List[uuid.UUID]] = None,
    ) -> int:
        """
        Marks multiple or all notifications for the user as read.
        """
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
        if notification_ids:
            query = query.filter(Notification.id.in_(notification_ids))

        unreads = query.all()
        now = datetime.now(timezone.utc)
        count = len(unreads)
        for n in unreads:
            n.is_read = True
            n.read_at = now

        db.commit()
        return count

    @staticmethod
    def delete_notification(
        db: Session,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a single notification.
        """
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        ).first()
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found.",
            )
        db.delete(notif)
        db.commit()
        return True

    @staticmethod
    def generate_due_bill_notifications(
        db: Session,
        user_id: uuid.UUID,
        reference_date: Optional[date] = None,
    ) -> int:
        """
        Generates notifications for upcoming and overdue recurring bills.
        Deduplicates against existing notifications by reference_id to ensure idempotency.
        """
        today = reference_date or date.today()
        active_bills = db.query(RecurringBill).filter(
            RecurringBill.user_id == user_id,
            RecurringBill.status == "active",
        ).all()

        generated_count = 0

        for bill in active_bills:
            days_diff = (bill.next_due_date - today).days

            # Overdue condition
            if days_diff < 0:
                ref_id = f"bill:{bill.id}:overdue:{bill.next_due_date.isoformat()}"
                exists = db.query(Notification).filter(
                    Notification.user_id == user_id,
                    Notification.reference_id == ref_id,
                ).first()
                if not exists:
                    notif = Notification(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        title=f"Bill Overdue: {bill.name}",
                        message=f"Your bill for '{bill.name}' (${bill.amount:,.2f}) was due on {bill.next_due_date.strftime('%b %d, %Y')} and is overdue by {abs(days_diff)} day(s).",
                        type="bill_overdue",
                        reference_id=ref_id,
                        is_read=False,
                    )
                    db.add(notif)
                    generated_count += 1

            # Upcoming condition
            elif days_diff <= bill.reminder_days_before:
                ref_id = f"bill:{bill.id}:upcoming:{bill.next_due_date.isoformat()}"
                exists = db.query(Notification).filter(
                    Notification.user_id == user_id,
                    Notification.reference_id == ref_id,
                ).first()
                if not exists:
                    due_str = "today" if days_diff == 0 else f"in {days_diff} day{'s' if days_diff > 1 else ''}"
                    notif = Notification(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        title=f"Upcoming Bill: {bill.name}",
                        message=f"Your bill for '{bill.name}' (${bill.amount:,.2f}) is due {due_str} on {bill.next_due_date.strftime('%b %d, %Y')}.",
                        type="bill_upcoming",
                        reference_id=ref_id,
                        is_read=False,
                    )
                    db.add(notif)
                    generated_count += 1

        if generated_count > 0:
            db.commit()

        return generated_count
