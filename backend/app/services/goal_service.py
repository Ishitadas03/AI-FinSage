"""
Goal Service (Phase 4A Part 1).

Pure, deterministic financial calculations and domain services for user financial goals.
Enforces strict user ownership, Decimal precision with ROUND_HALF_UP, and separates
persisted goal status from derived calculation states.
"""
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Union
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.financial_goal import (
    FinancialGoal,
    VALID_GOAL_TYPES,
    VALID_PRIORITIES,
    VALID_STATUSES,
)
from app.schemas.goals import (
    FinancialGoalCreate,
    FinancialGoalRead,
    FinancialGoalUpdate,
    FinancialGoalWithDerivedState,
    GoalDerivedState,
)


class GoalService:
    """Deterministic Goal Calculation Engine and Management Service."""

    # -----------------------------------------------------------------------
    # Pure Deterministic Calculation Functions
    # -----------------------------------------------------------------------
    @staticmethod
    def calculate_progress_percentage(
        current_amount: Union[Decimal, str, int, float],
        target_amount: Union[Decimal, str, int, float],
    ) -> Decimal:
        """
        Calculates percentage progress towards the target goal:
        (current_amount / target_amount) * 100

        Returns:
            Decimal quantized to 2 decimal places with ROUND_HALF_UP.
        """
        target = Decimal(str(target_amount))
        current = Decimal(str(current_amount))

        if target <= Decimal("0.00"):
            raise ValueError("target_amount must be greater than 0.")
        if current < Decimal("0.00"):
            raise ValueError("current_amount cannot be negative.")

        progress = (current / target) * Decimal("100")
        return progress.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_remaining_amount(
        current_amount: Union[Decimal, str, int, float],
        target_amount: Union[Decimal, str, int, float],
    ) -> Decimal:
        """
        Calculates remaining amount required to reach goal target:
        target_amount - current_amount

        Returns:
            Decimal quantized to 2 decimal places with ROUND_HALF_UP (min 0.00).
        """
        target = Decimal(str(target_amount))
        current = Decimal(str(current_amount))

        if target <= Decimal("0.00"):
            raise ValueError("target_amount must be greater than 0.")
        if current < Decimal("0.00"):
            raise ValueError("current_amount cannot be negative.")

        remaining = max(Decimal("0.00"), target - current)
        return remaining.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_remaining_months(
        target_date: date,
        reference_date: Optional[date] = None,
    ) -> int:
        """
        Calculates the exact number of calendar months remaining between
        reference_date and target_date. Does NOT use approximate 30-day assumptions.

        Rules:
        - If target_date <= reference_date: 0 months.
        - Calendar month difference = (target.year - ref.year)*12 + (target.month - ref.month)
        - Day adjustment: if target_date.day < reference_date.day (and not both end-of-month),
          a full month has not completed, so subtract 1.

        Returns:
            Non-negative integer number of complete calendar months remaining.
        """
        if reference_date is None:
            reference_date = date.today()

        if target_date <= reference_date:
            return 0

        months = (target_date.year - reference_date.year) * 12 + (target_date.month - reference_date.month)

        # Check for end-of-month alignment
        ref_is_eom = (reference_date + timedelta(days=1)).day == 1
        target_is_eom = (target_date + timedelta(days=1)).day == 1

        if not (ref_is_eom and target_is_eom):
            if target_date.day < reference_date.day:
                months -= 1

        return max(0, months)

    @staticmethod
    def calculate_required_monthly_contribution(
        remaining_amount: Union[Decimal, str, int, float],
        remaining_months: int,
        is_overdue: bool = False,
    ) -> Optional[Decimal]:
        """
        Calculates required monthly contribution:
        remaining_amount / remaining_months

        Rules:
        - If remaining_amount <= 0: returns Decimal("0.00").
        - If is_overdue: returns None (explicit overdue state, not a misleading value).
        - If remaining_months <= 0:
            - If overdue: returns None.
            - If due in current month (not overdue): returns remaining_amount.
        - If remaining_months > 0: returns (remaining_amount / remaining_months) quantized with ROUND_HALF_UP.

        Returns:
            Decimal or None if overdue.
        """
        remaining = Decimal(str(remaining_amount))

        if remaining <= Decimal("0.00"):
            return Decimal("0.00")

        if is_overdue:
            return None

        if remaining_months <= 0:
            return remaining.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        contrib = remaining / Decimal(remaining_months)
        return contrib.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_goal_derived_state(
        goal: Union[FinancialGoal, FinancialGoalRead],
        reference_date: Optional[date] = None,
    ) -> GoalDerivedState:
        """
        Computes all deterministic derived states for a financial goal without
        overwriting persisted database fields.
        """
        ref = reference_date or date.today()

        progress = GoalService.calculate_progress_percentage(
            goal.current_amount, goal.target_amount
        )
        remaining = GoalService.calculate_remaining_amount(
            goal.current_amount, goal.target_amount
        )

        is_overdue = goal.target_date < ref and remaining > Decimal("0.00")
        remaining_months = GoalService.calculate_remaining_months(goal.target_date, ref)

        required_monthly = GoalService.calculate_required_monthly_contribution(
            remaining_amount=remaining,
            remaining_months=remaining_months,
            is_overdue=is_overdue,
        )

        # Determine is_on_track deterministically
        if remaining <= Decimal("0.00") or goal.status == "completed":
            is_on_track = True
        elif is_overdue or goal.status in ("paused", "cancelled"):
            is_on_track = False
        elif goal.status == "active":
            is_on_track = goal.target_date >= ref
        else:
            is_on_track = False

        return GoalDerivedState(
            progress_percentage=progress,
            remaining_amount=remaining,
            remaining_months=remaining_months,
            required_monthly_contribution=required_monthly,
            is_overdue=is_overdue,
            is_on_track=is_on_track,
        )

    # -----------------------------------------------------------------------
    # Domain & CRUD Service Operations (Strict User Ownership)
    # -----------------------------------------------------------------------
    @staticmethod
    def create_goal(
        db: Session,
        user_id: uuid.UUID,
        payload: FinancialGoalCreate,
    ) -> FinancialGoalRead:
        """
        Creates a new financial goal record strictly tied to the authenticated user.
        """
        if not payload.name or not payload.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goal name cannot be empty.",
            )
        if payload.target_amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="target_amount must be greater than 0.",
            )
        if payload.current_amount < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="current_amount cannot be negative.",
            )
        if payload.current_amount > payload.target_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="current_amount cannot exceed target_amount.",
            )
        if payload.goal_type not in VALID_GOAL_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid goal_type '{payload.goal_type}'. Must be one of {sorted(VALID_GOAL_TYPES)}",
            )
        if payload.priority not in VALID_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority '{payload.priority}'. Must be one of {sorted(VALID_PRIORITIES)}",
            )
        if payload.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{payload.status}'. Must be one of {sorted(VALID_STATUSES)}",
            )

        goal = FinancialGoal(
            id=uuid.uuid4(),
            user_id=user_id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            goal_type=payload.goal_type,
            target_amount=payload.target_amount,
            current_amount=payload.current_amount,
            target_date=payload.target_date,
            priority=payload.priority,
            status=payload.status,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return FinancialGoalRead.model_validate(goal)

    @staticmethod
    def list_user_goals(
        db: Session,
        user_id: uuid.UUID,
        status_filter: Optional[str] = None,
    ) -> List[FinancialGoalRead]:
        """
        Returns all financial goals owned by the user, optionally filtered by status.
        """
        query = (
            db.query(FinancialGoal)
            .filter(FinancialGoal.user_id == user_id)
        )
        if status_filter:
            query = query.filter(FinancialGoal.status == status_filter)

        goals = query.order_by(FinancialGoal.target_date.asc(), FinancialGoal.created_at.desc()).all()
        return [FinancialGoalRead.model_validate(g) for g in goals]

    @staticmethod
    def get_user_goal_entity(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
    ) -> Optional[FinancialGoal]:
        """
        Retrieves the raw FinancialGoal entity with strict user ownership verification.
        """
        return (
            db.query(FinancialGoal)
            .filter(
                FinancialGoal.id == goal_id,
                FinancialGoal.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def get_user_goal(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
    ) -> Optional[FinancialGoalRead]:
        """
        Retrieves a single goal by ID, strictly verifying user ownership.
        """
        goal = GoalService.get_user_goal_entity(db, user_id, goal_id)
        if not goal:
            return None
        return FinancialGoalRead.model_validate(goal)

    @staticmethod
    def update_user_goal(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        payload: FinancialGoalUpdate,
    ) -> Optional[FinancialGoalRead]:
        """
        Updates an existing financial goal record with provided partial fields.
        Enforces cross-field validations (target vs current amount) and forbids user_id modification.
        """
        goal = GoalService.get_user_goal_entity(db, user_id, goal_id)
        if not goal:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        new_target = (
            payload.target_amount
            if payload.target_amount is not None
            else goal.target_amount
        )
        new_current = (
            payload.current_amount
            if payload.current_amount is not None
            else goal.current_amount
        )

        if new_target <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="target_amount must be greater than 0.",
            )
        if new_current < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="current_amount cannot be negative.",
            )
        if new_current > new_target:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="current_amount cannot exceed target_amount.",
            )

        if payload.goal_type is not None and payload.goal_type not in VALID_GOAL_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid goal_type '{payload.goal_type}'. Must be one of {sorted(VALID_GOAL_TYPES)}",
            )
        if payload.priority is not None and payload.priority not in VALID_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority '{payload.priority}'. Must be one of {sorted(VALID_PRIORITIES)}",
            )
        if payload.status is not None and payload.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{payload.status}'. Must be one of {sorted(VALID_STATUSES)}",
            )

        forbidden_keys = {"id", "user_id", "created_at", "updated_at"}
        for key, value in update_data.items():
            if key not in forbidden_keys and value is not None:
                if key == "name":
                    setattr(goal, key, str(value).strip())
                elif key == "description":
                    setattr(goal, key, str(value).strip() if value else None)
                else:
                    setattr(goal, key, value)

        db.commit()
        db.refresh(goal)
        return FinancialGoalRead.model_validate(goal)

    @staticmethod
    def delete_user_goal(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
    ) -> bool:
        """
        Deletes a financial goal record if owned by the user.
        """
        goal = GoalService.get_user_goal_entity(db, user_id, goal_id)
        if not goal:
            return False

        db.delete(goal)
        db.commit()
        return True

    @staticmethod
    def get_goal_with_derived_state(
        db: Session,
        user_id: uuid.UUID,
        goal_id: uuid.UUID,
        reference_date: Optional[date] = None,
    ) -> Optional[FinancialGoalWithDerivedState]:
        """
        Retrieves a user goal enriched with its calculated derived state.
        """
        goal = GoalService.get_user_goal_entity(db, user_id, goal_id)
        if not goal:
            return None

        goal_read = FinancialGoalRead.model_validate(goal)
        derived = GoalService.calculate_goal_derived_state(goal_read, reference_date)

        return FinancialGoalWithDerivedState(
            **goal_read.model_dump(),
            derived_state=derived,
        )
