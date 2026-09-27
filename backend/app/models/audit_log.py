"""
Audit Log SQLAlchemy Model (Phase 5).

Persists immutable security, profile change, data export, and account lifecycle audit events.
User-scoped and strictly isolated. Never logs sensitive credentials, tokens, or plaintext passwords.
"""
from datetime import datetime
from typing import Optional, Dict, Any
import uuid
from sqlalchemy import String, DateTime, ForeignKey, JSON, func, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

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
    action: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        default="general",
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )

    __table_args__ = (
        Index("ix_audit_logs_user_action", "user_id", "action"),
        Index("ix_audit_logs_user_created_at", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} user_id={self.user_id} action={self.action} created_at={self.created_at}>"


from sqlalchemy import event


@event.listens_for(AuditLog, "before_update")
def prevent_audit_log_modification(mapper, connection, target):
    """Enforces absolute immutability on audit log records."""
    raise ValueError("AuditLog records are strictly immutable and cannot be updated.")

