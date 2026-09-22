from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.loan import LoanCreate, LoanRead, LoanUpdate
from app.services.loan_service import LoanService

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.post(
    "",
    response_model=LoanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Loan",
)
def create_loan(
    payload: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new loan record tied exclusively to the authenticated user.
    """
    return LoanService.create_loan(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )


@router.get(
    "",
    response_model=List[LoanRead],
    status_code=status.HTTP_200_OK,
    summary="List All Loans for Current User",
)
def list_loans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists all loans owned by the authenticated user.
    """
    return LoanService.list_user_loans(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{loan_id}",
    response_model=LoanRead,
    status_code=status.HTTP_200_OK,
    summary="Get Loan Details by ID",
)
def get_loan(
    loan_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves details for a specific loan by ID.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    loan = LoanService.get_user_loan(
        db=db,
        user_id=current_user.id,
        loan_id=loan_id,
    )
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found.",
        )
    return loan


@router.patch(
    "/{loan_id}",
    response_model=LoanRead,
    status_code=status.HTTP_200_OK,
    summary="Update Loan Details",
)
def update_loan(
    loan_id: uuid.UUID,
    payload: LoanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates mutable properties of a loan.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    loan = LoanService.update_user_loan(
        db=db,
        user_id=current_user.id,
        loan_id=loan_id,
        payload=payload,
    )
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found.",
        )
    return loan


@router.delete(
    "/{loan_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Loan",
)
def delete_loan(
    loan_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a loan owned by the authenticated user.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    deleted = LoanService.delete_user_loan(
        db=db,
        user_id=current_user.id,
        loan_id=loan_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found.",
        )
    return MessageResponse(message="Loan successfully deleted.")
