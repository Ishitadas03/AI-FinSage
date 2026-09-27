"""
User Notification SQLAlchemy Model (Phase 3).

Stores user-scoped, persistent notifications (e.g. upcoming bills, overdue bills, paid confirmations, security alerts).
Supports read/unread state tracking, deterministic deduplication, and auditable timestamps.
"""
from datetime import datetime
from typing import Optional
import uuid
from sqlalchemy import (
    String,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    CheckConstraint,
    func,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


VALID_NOTIFICATION_TYPES = {
    "bill_upcoming",
    "bill_overdue",
    "bill_paid",
    "security",
    "goal",
    "insight",
    "budget_alert",
    "system",
}


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="system",
        index=True,
    )
    reference_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", backref="notifications")

    __table_args__ = (
        CheckConstraint(
            "type IN ('bill_upcoming', 'bill_overdue', 'bill_paid', 'security', 'goal', 'insight', 'budget_alert', 'system')",
            name="ck_notifications_type",
        ),
        Index("ix_notifications_user_read_created", "user_id", "is_read", "created_at"),
    )

    @validates("title")
    def validate_title(self, key, value):
        if value is None or not str(value).strip():
            raise ValueError("Notification title cannot be empty or whitespace.")
        return str(value).strip()

    @validates("type")
    def validate_type(self, key, value):
        cleaned = str(value).strip().lower() if value is not None else ""
        if cleaned not in VALID_NOTIFICATION_TYPES:
            raise ValueError(f"Invalid notification type '{value}'. Must be one of: {sorted(VALID_NOTIFICATION_TYPES)}")
        return cleaned

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user_id={self.user_id} title='{self.title}' type='{self.type}' is_read={self.is_read}>"
