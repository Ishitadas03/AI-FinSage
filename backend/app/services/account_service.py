from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate


class AccountService:
    @staticmethod
    def create_account(
        db: Session,
        user_id: uuid.UUID,
        payload: AccountCreate,
    ) -> Account:
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
        return account

    @staticmethod
    def list_user_accounts(
        db: Session,
        user_id: uuid.UUID,
    ) -> List[Account]:
        """
        Returns all active financial accounts owned by the specified user.
        """
        return (
            db.query(Account)
            .filter(Account.user_id == user_id)
            .order_by(Account.created_at.desc())
            .all()
        )

    @staticmethod
    def get_user_account(
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
    ) -> Optional[Account]:
        """
        Retrieves a single financial account by ID, strictly verifying user ownership.
        Returns None if not found or if the account belongs to another user.
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
    def update_user_account(
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
        payload: AccountUpdate,
    ) -> Optional[Account]:
        """
        Updates an existing financial account with provided partial fields.
        Returns None if the account is not found or does not belong to the user.
        """
        account = AccountService.get_user_account(db, user_id, account_id)
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
        return account

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
        account = AccountService.get_user_account(db, user_id, account_id)
        if not account:
            return False

        db.delete(account)
        db.commit()
        return True
