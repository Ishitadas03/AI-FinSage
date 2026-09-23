"""
Budget Service (Phase 4B Part 1).

Pure, deterministic budget calculations and management service for user financial budgets.
Enforces strict user ownership, Decimal precision with ROUND_HALF_UP, expense-only transaction aggregation,
and standard FinSage status thresholds (healthy <=80%, warning <=100%, over_budget >100%).
"""
from datetime import date, datetime, time
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Union
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import (
    Budget,
    VALID_BUDGET_CATEGORIES,
    VALID_BUDGET_PERIODS,
)
from app.models.transaction import Transaction
from app.schemas.budgets import (
    BudgetCreate,
    BudgetRead,
    BudgetSpendingSummary,
    BudgetUpdate,
    BudgetWithSpending,
)


class BudgetService:
    """Deterministic Budget Calculation Engine and Management Service."""

    # -----------------------------------------------------------------------
    # Pure Deterministic Calculation Functions
    # -----------------------------------------------------------------------
    @staticmethod
    def calculate_budget_spending(
        db: Session,
        user_id: uuid.UUID,
        category: str,
        start_date: date,
        end_date: date,
        budget_amount: Union[Decimal, str, int, float],
        budget_id: Optional[uuid.UUID] = None,
        budget_name: Optional[str] = None,
    ) -> BudgetSpendingSummary:
        """
        Computes deterministic category spending against budget allocation over a date window.

        Rules:
        - Only transactions owned by the authenticated user
        - Expense transactions ONLY (transfers and income are strictly excluded)
        - Matches requested category
        - Constrained within [start_date 00:00:00, end_date 23:59:59]
        - Decimal precision with ROUND_HALF_UP
        - Status: healthy (<=80%), warning (>80% and <=100%), over_budget (>100%)

        Returns:
            BudgetSpendingSummary with actual_spending, remaining, over_budget, percentage, and status.
        """
        budget_amt = Decimal(str(budget_amount))
        if budget_amt <= Decimal("0.00"):
            raise ValueError("budget_amount must be greater than 0.")

        if end_date < start_date:
            raise ValueError("end_date cannot be before start_date.")

        cleaned_cat = category.strip().lower()

        # Build datetime window
        start_dt = datetime.combine(start_date, time.min)
        end_dt = datetime.combine(end_date, time.max)

        # Aggregate only expense transactions for this user and category in the time window
        spending_query = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.category == cleaned_cat,
                Transaction.transaction_date >= start_dt,
                Transaction.transaction_date <= end_dt,
            )
        )
        raw_spending = spending_query.scalar()
        actual_spending = Decimal(str(raw_spending or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Remaining & Over-budget amounts
        remaining_amount = max(Decimal("0.00"), budget_amt - actual_spending).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        over_budget_amount = max(Decimal("0.00"), actual_spending - budget_amt).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Spending percentage
        if actual_spending <= Decimal("0.00"):
            spending_percentage = Decimal("0.00")
        else:
            percentage_calc = (actual_spending / budget_amt) * Decimal("100")
            spending_percentage = percentage_calc.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # FinSage Product Status Thresholds:
        # healthy: <= 80.00%
        # warning: > 80.00% and <= 100.00%
        # over_budget: > 100.00%
        if spending_percentage <= Decimal("80.00"):
            budget_status = "healthy"
        elif spending_percentage <= Decimal("100.00"):
            budget_status = "warning"
        else:
            budget_status = "over_budget"

        return BudgetSpendingSummary(
            budget_id=budget_id,
            budget_name=budget_name,
            category=cleaned_cat,
            start_date=start_date,
            end_date=end_date,
            budget_amount=budget_amt.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            actual_spending=actual_spending,
            remaining_amount=remaining_amount,
            over_budget_amount=over_budget_amount,
            spending_percentage=spending_percentage,
            status=budget_status,
        )

    # -----------------------------------------------------------------------
    # CRUD Domain Operations (Strict User Ownership)
    # -----------------------------------------------------------------------
    @staticmethod
    def create_budget(
        db: Session,
        user_id: uuid.UUID,
        payload: BudgetCreate,
    ) -> BudgetRead:
        """
        Creates a new budget record strictly scoped to the authenticated user.
        """
        if not payload.name or not payload.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget name cannot be empty.",
            )
        if payload.amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget amount must be greater than 0.",
            )
        if payload.category not in VALID_BUDGET_CATEGORIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category '{payload.category}'. Must be one of: {sorted(VALID_BUDGET_CATEGORIES)}",
            )
        if payload.period not in VALID_BUDGET_PERIODS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid period '{payload.period}'. Must be one of: {sorted(VALID_BUDGET_PERIODS)}",
            )
        if payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date cannot be before start_date.",
            )

        budget = Budget(
            id=uuid.uuid4(),
            user_id=user_id,
            name=payload.name.strip(),
            category=payload.category,
            amount=payload.amount,
            period=payload.period,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return BudgetRead.model_validate(budget)

    @staticmethod
    def create_budget_with_spending(
        db: Session,
        user_id: uuid.UUID,
        payload: BudgetCreate,
    ) -> BudgetWithSpending:
        """
        Creates a new budget record and returns it enriched with its initial spending summary.
        """
        budget_read = BudgetService.create_budget(db, user_id, payload)
        spending = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user_id,
            category=budget_read.category,
            start_date=budget_read.start_date,
            end_date=budget_read.end_date,
            budget_amount=budget_read.amount,
            budget_id=budget_read.id,
            budget_name=budget_read.name,
        )
        return BudgetWithSpending(**budget_read.model_dump(), spending=spending)

    @staticmethod
    def list_user_budgets(
        db: Session,
        user_id: uuid.UUID,
        category: Optional[str] = None,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> List[BudgetRead]:
        """
        Lists all budgets owned by the user with optional category, period, date filters, and pagination.
        """
        query = db.query(Budget).filter(Budget.user_id == user_id)
        if category:
            query = query.filter(Budget.category == category.strip().lower())
        if period:
            query = query.filter(Budget.period == period.strip().lower())
        if start_date:
            query = query.filter(Budget.start_date >= start_date)
        if end_date:
            query = query.filter(Budget.end_date <= end_date)

        query = query.order_by(Budget.start_date.desc(), Budget.created_at.desc())

        if page is not None or page_size is not None:
            p = page if page is not None and page >= 1 else 1
            ps = page_size if page_size is not None and page_size >= 1 else 20
            offset = (p - 1) * ps
            query = query.offset(offset).limit(ps)

        budgets = query.all()
        return [BudgetRead.model_validate(b) for b in budgets]

    @staticmethod
    def list_user_budgets_with_spending(
        db: Session,
        user_id: uuid.UUID,
        category: Optional[str] = None,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> List[BudgetWithSpending]:
        """
        Lists user budgets enriched with their real-time spending summaries.
        """
        budgets = BudgetService.list_user_budgets(
            db=db,
            user_id=user_id,
            category=category,
            period=period,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )
        results = []
        for b in budgets:
            spending = BudgetService.calculate_budget_spending(
                db=db,
                user_id=user_id,
                category=b.category,
                start_date=b.start_date,
                end_date=b.end_date,
                budget_amount=b.amount,
                budget_id=b.id,
                budget_name=b.name,
            )
            results.append(BudgetWithSpending(**b.model_dump(), spending=spending))
        return results


    @staticmethod
    def get_user_budget_entity(
        db: Session,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
    ) -> Optional[Budget]:
        """
        Retrieves the raw Budget entity strictly scoped to user_id.
        """
        return (
            db.query(Budget)
            .filter(Budget.id == budget_id, Budget.user_id == user_id)
            .first()
        )

    @staticmethod
    def get_user_budget(
        db: Session,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
    ) -> Optional[BudgetRead]:
        """
        Retrieves a single budget by ID strictly scoped to user_id.
        """
        budget = BudgetService.get_user_budget_entity(db, user_id, budget_id)
        if not budget:
            return None
        return BudgetRead.model_validate(budget)

    @staticmethod
    def get_user_budget_with_spending(
        db: Session,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
    ) -> Optional[BudgetWithSpending]:
        """
        Retrieves a single user budget enriched with its spending summary.
        """
        budget = BudgetService.get_user_budget(db, user_id, budget_id)
        if not budget:
            return None
        spending = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user_id,
            category=budget.category,
            start_date=budget.start_date,
            end_date=budget.end_date,
            budget_amount=budget.amount,
            budget_id=budget.id,
            budget_name=budget.name,
        )
        return BudgetWithSpending(**budget.model_dump(), spending=spending)

    @staticmethod
    def update_user_budget(
        db: Session,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
        payload: BudgetUpdate,
    ) -> Optional[BudgetRead]:
        """
        Updates an existing budget record with partial updates.
        Enforces cross-field validations (end_date >= start_date, amount > 0).
        """
        budget = BudgetService.get_user_budget_entity(db, user_id, budget_id)
        if not budget:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        new_start = payload.start_date if payload.start_date is not None else budget.start_date
        new_end = payload.end_date if payload.end_date is not None else budget.end_date
        if new_end < new_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date cannot be before start_date.",
            )

        if payload.amount is not None and payload.amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget amount must be greater than 0.",
            )

        if payload.category is not None and payload.category not in VALID_BUDGET_CATEGORIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category '{payload.category}'. Must be one of: {sorted(VALID_BUDGET_CATEGORIES)}",
            )

        if payload.period is not None and payload.period not in VALID_BUDGET_PERIODS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid period '{payload.period}'. Must be one of: {sorted(VALID_BUDGET_PERIODS)}",
            )

        forbidden_keys = {"id", "user_id", "created_at", "updated_at"}
        for key, value in update_data.items():
            if key not in forbidden_keys and value is not None:
                if key == "name":
                    setattr(budget, key, str(value).strip())
                else:
                    setattr(budget, key, value)

        db.commit()
        db.refresh(budget)
        return BudgetRead.model_validate(budget)

    @staticmethod
    def update_user_budget_with_spending(
        db: Session,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
        payload: BudgetUpdate,
    ) -> Optional[BudgetWithSpending]:
        """
        Updates an existing budget and returns it with a freshly calculated spending summary.
        """
        updated = BudgetService.update_user_budget(db, user_id, budget_id, payload)
        if not updated:
            return None
        spending = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user_id,
            category=updated.category,
            start_date=updated.start_date,
            end_date=updated.end_date,
            budget_amount=updated.amount,
            budget_id=updated.id,
            budget_name=updated.name,
        )
        return BudgetWithSpending(**updated.model_dump(), spending=spending)


    @staticmethod
    def delete_user_budget(
        db: Session,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a budget owned by the authenticated user.
        """
        budget = BudgetService.get_user_budget_entity(db, user_id, budget_id)
        if not budget:
            return False

        db.delete(budget)
        db.commit()
        return True
