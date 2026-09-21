from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.transaction import (
    TransactionCreate,
    TransactionPaginatedResponse,
    TransactionRead,
    TransactionType,
    TransactionCategory,
    TransactionUpdate,
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Financial Transaction",
)
def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new financial transaction (income, expense, transfer)
    tied to an account owned exclusively by the authenticated user.
    """
    transaction = TransactionService.create_transaction(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )
    return transaction


@router.get(
    "",
    response_model=TransactionPaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="List All Transactions for Current User",
)
def list_transactions(
    account_id: Optional[uuid.UUID] = Query(None, description="Filter by account ID"),
    transaction_type: Optional[TransactionType] = Query(None, description="Filter by transaction type"),
    category: Optional[TransactionCategory] = Query(None, description="Filter by category"),
    merchant: Optional[str] = Query(None, description="Filter by merchant (case-insensitive search)"),
    start_date: Optional[datetime] = Query(None, description="Filter transactions on or after this timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter transactions on or before this timestamp"),
    min_amount: Optional[Decimal] = Query(None, description="Filter transactions with amount >= min_amount"),
    max_amount: Optional[Decimal] = Query(None, description="Filter transactions with amount <= max_amount"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Page size (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists transactions belonging exclusively to the authenticated user with rich filtering and pagination.
    """
    return TransactionService.list_user_transactions(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
        transaction_type=transaction_type.value if transaction_type else None,
        category=category.value if category else None,
        merchant=merchant,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{transaction_id}",
    response_model=TransactionRead,
    status_code=status.HTTP_200_OK,
    summary="Get Transaction by ID",
)
def get_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves a single transaction by ID.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    transaction = TransactionService.get_user_transaction(
        db=db,
        user_id=current_user.id,
        transaction_id=transaction_id,
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )
    return transaction


@router.patch(
    "/{transaction_id}",
    response_model=TransactionRead,
    status_code=status.HTTP_200_OK,
    summary="Update Transaction Details",
)
def update_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Partially updates a transaction owned by the authenticated user.
    If the account_id is changed, validates that the new account also belongs to the user.
    """
    transaction = TransactionService.update_user_transaction(
        db=db,
        user_id=current_user.id,
        transaction_id=transaction_id,
        payload=payload,
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )
    return transaction


@router.delete(
    "/{transaction_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Financial Transaction",
)
def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a transaction owned by the authenticated user.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    deleted = TransactionService.delete_user_transaction(
        db=db,
        user_id=current_user.id,
        transaction_id=transaction_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )
    return MessageResponse(message="Transaction successfully deleted.")
