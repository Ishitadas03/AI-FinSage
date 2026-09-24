from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import String, DateTime, Numeric, ForeignKey, Index, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

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
    account_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    destination_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    transaction_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    category: Mapped[Optional[str]] = mapped_column(
        String(50),
        index=True,
        nullable=True,
    )
    merchant: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    reference: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    source: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        default=None,
    )
    import_fingerprint: Mapped[Optional[str]] = mapped_column(
        String(64),
        index=True,
        nullable=True,
        default=None,
    )
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="transactions")
    account = relationship("Account", foreign_keys=[account_id], backref="source_transactions")
    destination_account = relationship(
        "Account",
        foreign_keys=[destination_account_id],
        backref="destination_transactions",
    )

    __table_args__ = (
        Index("ix_transactions_user_id_transaction_date", "user_id", "transaction_date"),
        Index(
            "uq_transactions_user_account_fingerprint",
            "user_id",
            "account_id",
            "import_fingerprint",
            unique=True,
            postgresql_where=text("import_fingerprint IS NOT NULL"),
            sqlite_where=text("import_fingerprint IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} user_id={self.user_id} account_id={self.account_id} "
            f"dest={self.destination_account_id} type={self.transaction_type} amount={self.amount}>"
        )
