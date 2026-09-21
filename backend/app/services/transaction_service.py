from datetime import datetime
from decimal import Decimal
import math
from typing import Any, Dict, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    @staticmethod
    def create_transaction(
        db: Session,
        user_id: uuid.UUID,
        payload: TransactionCreate,
    ) -> Transaction:
        """
        Creates a new transaction for the authenticated user.
        Strictly verifies that the specified account belongs to the user.
        """
        # Validate that the account exists and is owned by current user
        account = (
            db.query(Account)
            .filter(
                Account.id == payload.account_id,
                Account.user_id == user_id,
            )
            .first()
        )
        if not account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified account does not exist or does not belong to the authenticated user.",
            )

        transaction = Transaction(
            id=uuid.uuid4(),
            user_id=user_id,
            account_id=payload.account_id,
            amount=payload.amount,
            transaction_type=payload.transaction_type.value,
            category=payload.category.value,
            merchant=payload.merchant,
            description=payload.description,
            transaction_date=payload.transaction_date,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    @staticmethod
    def list_user_transactions(
        db: Session,
        user_id: uuid.UUID,
        account_id: Optional[uuid.UUID] = None,
        transaction_type: Optional[str] = None,
        category: Optional[str] = None,
        merchant: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Lists transactions belonging exclusively to the authenticated user with filtering and pagination.
        Ordered newest first (by transaction_date descending, created_at descending).
        """
        query = db.query(Transaction).filter(Transaction.user_id == user_id)

        if account_id is not None:
            query = query.filter(Transaction.account_id == account_id)
        if transaction_type is not None:
            query = query.filter(Transaction.transaction_type == transaction_type)
        if category is not None:
            query = query.filter(Transaction.category == category)
        if merchant is not None and merchant.strip():
            query = query.filter(Transaction.merchant.ilike(f"%{merchant.strip()}%"))
        if start_date is not None:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date is not None:
            query = query.filter(Transaction.transaction_date <= end_date)
        if min_amount is not None:
            query = query.filter(Transaction.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Transaction.amount <= max_amount)

        total = query.count()

        # Enforce page & page_size bounds
        sanitized_page = max(1, page)
        sanitized_page_size = max(1, min(page_size, 100))
        offset = (sanitized_page - 1) * sanitized_page_size

        items = (
            query.order_by(
                Transaction.transaction_date.desc(),
                Transaction.created_at.desc(),
            )
            .offset(offset)
            .limit(sanitized_page_size)
            .all()
        )

        total_pages = math.ceil(total / sanitized_page_size) if total > 0 else 0

        return {
            "items": items,
            "total": total,
            "page": sanitized_page,
            "page_size": sanitized_page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_user_transaction(
        db: Session,
        user_id: uuid.UUID,
        transaction_id: uuid.UUID,
    ) -> Optional[Transaction]:
        """
        Retrieves a single transaction by ID, strictly verifying user ownership.
        Returns None if not found or if the transaction belongs to another user.
        """
        return (
            db.query(Transaction)
            .filter(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def update_user_transaction(
        db: Session,
        user_id: uuid.UUID,
        transaction_id: uuid.UUID,
        payload: TransactionUpdate,
    ) -> Optional[Transaction]:
        """
        Updates an existing transaction with partial fields.
        Verifies ownership and validates any changed account belongs to the user.
        """
        transaction = TransactionService.get_user_transaction(db, user_id, transaction_id)
        if not transaction:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        # If account_id is changing, verify the new account belongs to the user
        if "account_id" in update_data and update_data["account_id"] is not None:
            new_account_id = update_data["account_id"]
            account = (
                db.query(Account)
                .filter(
                    Account.id == new_account_id,
                    Account.user_id == user_id,
                )
                .first()
            )
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The target account does not exist or does not belong to the authenticated user.",
                )

        for key, value in update_data.items():
            if key in ("transaction_type", "category") and value is not None:
                setattr(transaction, key, value.value if hasattr(value, "value") else str(value))
            elif key != "user_id":  # Ensure user_id cannot be overwritten
                setattr(transaction, key, value)

        db.commit()
        db.refresh(transaction)
        return transaction

    @staticmethod
    def delete_user_transaction(
        db: Session,
        user_id: uuid.UUID,
        transaction_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a transaction if owned by the user.
        Returns True if deleted, False if not found or unauthorized.
        """
        transaction = TransactionService.get_user_transaction(db, user_id, transaction_id)
        if not transaction:
            return False

        db.delete(transaction)
        db.commit()
        return True
