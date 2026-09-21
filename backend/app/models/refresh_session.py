import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

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
    token_hash: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    is_revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="refresh_sessions")

    def __repr__(self) -> str:
        return f"<RefreshSession id={self.id} user_id={self.user_id} is_revoked={self.is_revoked}>"
