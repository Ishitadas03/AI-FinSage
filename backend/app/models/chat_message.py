"""
User Copilot Chat Message SQLAlchemy Model (Phase 4).

Stores user-scoped conversational history with the Grounded AI Copilot.
Includes role tracking, intent tags, structured metrics snapshots, and audit timestamps.
"""
from datetime import datetime
from typing import Optional, Dict, Any
import uuid
import json
from sqlalchemy import (
    String,
    DateTime,
    Text,
    ForeignKey,
    CheckConstraint,
    func,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


VALID_ROLES = {"user", "assistant", "system"}


class ChatMessage(Base):
    __tablename__ = "chat_messages"

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
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="user",
        index=True,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    intent: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    metrics_snapshot: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", backref="chat_messages")

    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_chat_messages_role",
        ),
        Index("ix_chat_messages_user_created", "user_id", "created_at"),
    )

    @validates("role")
    def validate_role(self, key, value):
        cleaned = str(value).strip().lower() if value is not None else ""
        if cleaned not in VALID_ROLES:
            raise ValueError(f"Invalid chat role '{value}'. Must be one of: {sorted(VALID_ROLES)}")
        return cleaned

    @validates("content")
    def validate_content(self, key, value):
        if value is None or not str(value).strip():
            raise ValueError("Chat message content cannot be empty.")
        return str(value).strip()

    def get_metrics_snapshot_dict(self) -> Optional[Dict[str, Any]]:
        if not self.metrics_snapshot:
            return None
        try:
            return json.loads(self.metrics_snapshot)
        except Exception:
            return None

    def __repr__(self) -> str:
        return f"<ChatMessage id={self.id} user_id={self.user_id} role='{self.role}' created_at={self.created_at}>"
