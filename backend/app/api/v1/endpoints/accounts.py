from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate, AccountRead
from app.schemas.auth import MessageResponse
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post(
    "",
    response_model=AccountRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Financial Account",
)
def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new financial account (savings, current, credit card, investment, cash, etc.)
    tied exclusively to the authenticated user.
    """
    account = AccountService.create_account(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )
    return account


@router.get(
    "",
    response_model=List[AccountRead],
    status_code=status.HTTP_200_OK,
    summary="List All Accounts for Current User",
)
def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists all financial accounts owned by the authenticated user.
    """
    return AccountService.list_user_accounts(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{account_id}",
    response_model=AccountRead,
    status_code=status.HTTP_200_OK,
    summary="Get Account Details by ID",
)
def get_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves details for a specific financial account by ID.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    account = AccountService.get_user_account(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )
    return account


@router.patch(
    "/{account_id}",
    response_model=AccountRead,
    status_code=status.HTTP_200_OK,
    summary="Update Account Details",
)
def update_account(
    account_id: uuid.UUID,
    payload: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates mutable properties of a financial account (name, type, balance, currency).
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    account = AccountService.update_user_account(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
        payload=payload,
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )
    return account


@router.delete(
    "/{account_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Financial Account",
)
def delete_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a financial account owned by the authenticated user.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    deleted = AccountService.delete_user_account(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )
    return MessageResponse(message="Account successfully deleted.")
