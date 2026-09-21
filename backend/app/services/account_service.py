from decimal import Decimal
from typing import List, Optional
import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate


class AccountService:
    @staticmethod
    def calculate_account_balance(db: Session, account: Account) -> Decimal:
        """
        Dynamically calculates the current balance of an account from opening balance
        and all ledger transactions.

        Asset accounts (savings, current, cash, investment, other):
          current_balance = opening_balance + income - expense - transfers_out + transfers_in

        Liability accounts (credit_card):
          current_balance (outstanding debt) = opening_balance + expense - income + transfers_out - transfers_in
        """
        # Aggregate transactions where this account is the source
        source_totals = (
            db.query(
                Transaction.transaction_type,
                func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label("total"),
            )
            .filter(Transaction.account_id == account.id)
            .group_by(Transaction.transaction_type)
            .all()
        )
        totals_map = {tx_type: total for tx_type, total in source_totals}
        income = totals_map.get("income", Decimal("0.00"))
        expense = totals_map.get("expense", Decimal("0.00"))
        transfers_out = totals_map.get("transfer", Decimal("0.00"))

        # Aggregate transfers where this account is the destination
        transfers_in = (
            db.query(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
            .filter(
                Transaction.destination_account_id == account.id,
                Transaction.transaction_type == "transfer",
            )
            .scalar()
        ) or Decimal("0.00")

        if account.account_type == "credit_card":
            return account.balance + expense - income + transfers_out - transfers_in
        else:
            return account.balance + income - expense - transfers_out + transfers_in

    @staticmethod
    def to_account_read(db: Session, account: Account) -> AccountRead:
        """Helper to convert an Account entity into an AccountRead schema with dynamic current_balance."""
        current_balance = AccountService.calculate_account_balance(db, account)
        return AccountRead(
            id=account.id,
            user_id=account.user_id,
            name=account.name,
            account_type=account.account_type,
            balance=account.balance,
            current_balance=current_balance,
            currency=account.currency,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )

    @staticmethod
    def create_account(
        db: Session,
        user_id: uuid.UUID,
        payload: AccountCreate,
    ) -> AccountRead:
        """
        Creates a new financial account belonging to the authenticated user.
        """
        account = Account(
            id=uuid.uuid4(),
            user_id=user_id,
            name=payload.name,
            account_type=payload.account_type.value,
            balance=payload.balance,
            currency=payload.currency,
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return AccountService.to_account_read(db, account)

    @staticmethod
    def list_user_accounts(
        db: Session,
        user_id: uuid.UUID,
    ) -> List[AccountRead]:
        """
        Returns all active financial accounts owned by the specified user with calculated current balances.
        """
        accounts = (
            db.query(Account)
            .filter(Account.user_id == user_id)
            .order_by(Account.created_at.desc())
            .all()
        )
        return [AccountService.to_account_read(db, acc) for acc in accounts]

    @staticmethod
    def get_user_account_entity(
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
    ) -> Optional[Account]:
        """
        Retrieves the raw Account entity for internal operations with user ownership verification.
        """
        return (
            db.query(Account)
            .filter(
                Account.id == account_id,
                Account.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def get_user_account(
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
    ) -> Optional[AccountRead]:
        """
        Retrieves a single financial account by ID, strictly verifying user ownership.
        Returns AccountRead with calculated current_balance, or None if not found/unauthorized.
        """
        account = AccountService.get_user_account_entity(db, user_id, account_id)
        if not account:
            return None
        return AccountService.to_account_read(db, account)

    @staticmethod
    def update_user_account(
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
        payload: AccountUpdate,
    ) -> Optional[AccountRead]:
        """
        Updates an existing financial account with provided partial fields.
        Returns updated AccountRead with calculated current_balance, or None if not found.
        """
        account = AccountService.get_user_account_entity(db, user_id, account_id)
        if not account:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "account_type" and value is not None:
                setattr(account, key, value.value if hasattr(value, "value") else str(value))
            elif value is not None:
                setattr(account, key, value)

        db.commit()
        db.refresh(account)
        return AccountService.to_account_read(db, account)

    @staticmethod
    def delete_user_account(
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a financial account if owned by the user.
        Returns True if successfully deleted, False if not found or unauthorized.
        """
        account = AccountService.get_user_account_entity(db, user_id, account_id)
        if not account:
            return False

        db.delete(account)
        db.commit()
        return True
