"""
Goal Contribution Service (Phase 4A Part 3).

Provides deterministic contribution ledger management for financial goals.
Enforces strict user ownership, immutable contribution audit trails,
and cross-field constraints (contributions cannot exceed goal target).
"""
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.financial_goal import FinancialGoal
from app.models.financial_goal_contribution import FinancialGoalContribution
from app.schemas.goal_contributions import (
    GoalContributionCreate,
    GoalContributionRead,
    GoalContributionSummary,
)


class GoalContributionService:
    """Service for managing goal contributions and computing ledger totals."""

    @staticmethod
    def calculate_goal_current_amount(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
    ) -> Decimal:
        """
        Calculates the deterministic sum of all contributions for a user goal:
        SUM(all valid contributions)

        Returns:
            Decimal("0.00") if no contributions exist, quantized with ROUND_HALF_UP.
        """
        result = (
            db.query(func.coalesce(func.sum(FinancialGoalContribution.amount), 0))
            .filter(
                FinancialGoalContribution.goal_id == goal_id,
                FinancialGoalContribution.user_id == user_id,
            )
            .scalar()
        )
        if result is None:
            return Decimal("0.00")
        return Decimal(str(result)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def get_goal_contributions_summary(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
    ) -> GoalContributionSummary:
        """
        Retrieves aggregate contribution summary metrics for a goal.
        """
        total = GoalContributionService.calculate_goal_current_amount(db, user_id, goal_id)
        count = (
            db.query(func.count(FinancialGoalContribution.id))
            .filter(
                FinancialGoalContribution.goal_id == goal_id,
                FinancialGoalContribution.user_id == user_id,
            )
            .scalar()
            or 0
        )
        latest_date = (
            db.query(func.max(FinancialGoalContribution.contribution_date))
            .filter(
                FinancialGoalContribution.goal_id == goal_id,
                FinancialGoalContribution.user_id == user_id,
            )
            .scalar()
        )

        return GoalContributionSummary(
            total_contributions=total,
            contribution_count=count,
            latest_contribution_date=latest_date,
        )

    @staticmethod
    def create_contribution(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        payload: GoalContributionCreate,
    ) -> GoalContributionRead:
        """
        Records a new contribution ledger entry for a user's goal.
        Validates goal existence, ownership, amount positivity, and total amount cap.
        """
        goal = (
            db.query(FinancialGoal)
            .filter(
                FinancialGoal.id == goal_id,
                FinancialGoal.user_id == user_id,
            )
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial goal not found.",
            )

        if payload.amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contribution amount must be greater than 0.",
            )

        # Validate that cumulative contributions do not exceed goal target
        current_contributions_sum = GoalContributionService.calculate_goal_current_amount(
            db=db, user_id=user_id, goal_id=goal_id
        )
        new_total = current_contributions_sum + payload.amount
        if new_total > goal.target_amount:
            remaining_cap = max(Decimal("0.00"), goal.target_amount - current_contributions_sum)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contribution amount of {payload.amount} exceeds remaining goal target capacity of {remaining_cap}.",
            )

        contribution = FinancialGoalContribution(
            id=uuid.uuid4(),
            goal_id=goal_id,
            user_id=user_id,
            amount=payload.amount,
            contribution_date=payload.contribution_date,
            note=payload.note,
        )
        db.add(contribution)
        db.commit()
        db.refresh(contribution)

        return GoalContributionRead.model_validate(contribution)

    @staticmethod
    def list_contributions(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> List[GoalContributionRead]:
        """
        Lists contribution records for a goal belonging to the authenticated user.
        Supports date filtering and pagination.
        """
        goal = (
            db.query(FinancialGoal)
            .filter(
                FinancialGoal.id == goal_id,
                FinancialGoal.user_id == user_id,
            )
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Financial goal not found.",
            )

        query = (
            db.query(FinancialGoalContribution)
            .filter(
                FinancialGoalContribution.goal_id == goal_id,
                FinancialGoalContribution.user_id == user_id,
            )
        )

        if start_date:
            query = query.filter(FinancialGoalContribution.contribution_date >= start_date)
        if end_date:
            query = query.filter(FinancialGoalContribution.contribution_date <= end_date)

        query = query.order_by(
            FinancialGoalContribution.contribution_date.desc(),
            FinancialGoalContribution.created_at.desc(),
        )

        if page is not None or page_size is not None:
            p = page if page is not None and page >= 1 else 1
            ps = page_size if page_size is not None and page_size >= 1 else 20
            offset = (p - 1) * ps
            query = query.offset(offset).limit(ps)

        contributions = query.all()
        return [GoalContributionRead.model_validate(c) for c in contributions]

    @staticmethod
    def get_contribution(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        contribution_id: uuid.UUID,
    ) -> Optional[GoalContributionRead]:
        """
        Retrieves a single contribution record by ID, verifying goal and user ownership.
        """
        contribution = (
            db.query(FinancialGoalContribution)
            .filter(
                FinancialGoalContribution.id == contribution_id,
                FinancialGoalContribution.goal_id == goal_id,
                FinancialGoalContribution.user_id == user_id,
            )
            .first()
        )
        if not contribution:
            return None
        return GoalContributionRead.model_validate(contribution)

    @staticmethod
    def delete_contribution(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        contribution_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a single contribution record if owned by the user and tied to the goal.
        """
        contribution = (
            db.query(FinancialGoalContribution)
            .filter(
                FinancialGoalContribution.id == contribution_id,
                FinancialGoalContribution.goal_id == goal_id,
                FinancialGoalContribution.user_id == user_id,
            )
            .first()
        )
        if not contribution:
            return False

        db.delete(contribution)
        db.commit()
        return True
