from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.loan import Loan
from app.schemas.loan import LoanCreate, LoanRead, LoanUpdate


class LoanService:
    @staticmethod
    def create_loan(
        db: Session,
        user_id: uuid.UUID,
        payload: LoanCreate,
    ) -> LoanRead:
        """
        Creates a new loan record tied exclusively to the authenticated user.
        """
        if payload.principal_amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="principal_amount must be greater than 0.",
            )
        if payload.outstanding_principal < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="outstanding_principal cannot be negative.",
            )
        if payload.outstanding_principal > payload.principal_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="outstanding_principal cannot exceed principal_amount.",
            )
        if payload.interest_rate < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="interest_rate cannot be negative.",
            )
        if payload.tenure_months <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="tenure_months must be greater than 0.",
            )
        if payload.monthly_emi <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="monthly_emi must be greater than 0.",
            )
        if payload.end_date is not None and payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date cannot be before start_date.",
            )

        loan = Loan(
            id=uuid.uuid4(),
            user_id=user_id,
            name=payload.name,
            principal_amount=payload.principal_amount,
            outstanding_principal=payload.outstanding_principal,
            interest_rate=payload.interest_rate,
            tenure_months=payload.tenure_months,
            monthly_emi=payload.monthly_emi,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return LoanRead.model_validate(loan)

    @staticmethod
    def list_user_loans(
        db: Session,
        user_id: uuid.UUID,
    ) -> List[LoanRead]:
        """
        Returns all active loan records owned by the authenticated user.
        """
        loans = (
            db.query(Loan)
            .filter(Loan.user_id == user_id)
            .order_by(Loan.created_at.desc())
            .all()
        )
        return [LoanRead.model_validate(loan) for loan in loans]

    @staticmethod
    def get_user_loan_entity(
        db: Session,
        user_id: uuid.UUID,
        loan_id: uuid.UUID,
    ) -> Optional[Loan]:
        """
        Retrieves the raw Loan entity with strict user ownership verification.
        """
        return (
            db.query(Loan)
            .filter(
                Loan.id == loan_id,
                Loan.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def get_user_loan(
        db: Session,
        user_id: uuid.UUID,
        loan_id: uuid.UUID,
    ) -> Optional[LoanRead]:
        """
        Retrieves a single loan by ID, strictly verifying user ownership.
        Returns LoanRead or None if not found/unauthorized.
        """
        loan = LoanService.get_user_loan_entity(db, user_id, loan_id)
        if not loan:
            return None
        return LoanRead.model_validate(loan)

    @staticmethod
    def update_user_loan(
        db: Session,
        user_id: uuid.UUID,
        loan_id: uuid.UUID,
        payload: LoanUpdate,
    ) -> Optional[LoanRead]:
        """
        Updates an existing loan record with provided partial fields while strictly
        revalidating cross-field rules (principal vs outstanding, start vs end date).
        """
        loan = LoanService.get_user_loan_entity(db, user_id, loan_id)
        if not loan:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        new_principal = (
            payload.principal_amount
            if payload.principal_amount is not None
            else loan.principal_amount
        )
        new_outstanding = (
            payload.outstanding_principal
            if payload.outstanding_principal is not None
            else loan.outstanding_principal
        )
        new_start_date = (
            payload.start_date
            if payload.start_date is not None
            else loan.start_date
        )
        new_end_date = (
            payload.end_date
            if "end_date" in update_data
            else loan.end_date
        )

        if new_principal <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="principal_amount must be greater than 0.",
            )
        if new_outstanding < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="outstanding_principal cannot be negative.",
            )
        if new_outstanding > new_principal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="outstanding_principal cannot exceed principal_amount.",
            )
        if payload.interest_rate is not None and payload.interest_rate < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="interest_rate cannot be negative.",
            )
        if payload.tenure_months is not None and payload.tenure_months <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="tenure_months must be greater than 0.",
            )
        if payload.monthly_emi is not None and payload.monthly_emi <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="monthly_emi must be greater than 0.",
            )
        if new_end_date is not None and new_start_date is not None and new_end_date < new_start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date cannot be before start_date.",
            )

        forbidden_keys = {"id", "user_id", "created_at", "updated_at"}
        for key, value in update_data.items():
            if key not in forbidden_keys:
                setattr(loan, key, value)

        db.commit()
        db.refresh(loan)
        return LoanRead.model_validate(loan)

    @staticmethod
    def delete_user_loan(
        db: Session,
        user_id: uuid.UUID,
        loan_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a loan record if owned by the user.
        Returns True if deleted, False if not found or unauthorized.
        """
        loan = LoanService.get_user_loan_entity(db, user_id, loan_id)
        if not loan:
            return False

        db.delete(loan)
        db.commit()
        return True
