"""
Financial Goals API Endpoints (Phase 4A Part 2).

Protected REST API endpoints for financial goal creation, retrieval, updates,
filtering, pagination, and deletion, enriched with deterministic derived calculations.
Strict user ownership is enforced on every endpoint.
"""
from datetime import date
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status

from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.goals import (
    FinancialGoalCreate,
    FinancialGoalUpdate,
    FinancialGoalWithDerivedState,
    VALID_GOAL_TYPES,
    VALID_PRIORITIES,
    VALID_STATUSES,
)
from app.schemas.goal_contributions import (
    GoalContributionCreate,
    GoalContributionRead,
)
from app.services.goal_service import GoalService
from app.services.goal_contribution_service import GoalContributionService

router = APIRouter(prefix="/goals", tags=["Financial Goals"])



@router.post(
    "",
    response_model=FinancialGoalWithDerivedState,
    status_code=http_status.HTTP_201_CREATED,
    summary="Create New Financial Goal",
)
def create_goal(
    payload: FinancialGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new financial goal record strictly tied to the authenticated user.
    Returns the created goal enriched with its initial calculated derived state.
    """
    return GoalService.create_goal_with_derived_state(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )


@router.get(
    "",
    response_model=List[FinancialGoalWithDerivedState],
    status_code=http_status.HTTP_200_OK,
    summary="List All Financial Goals for Current User",
)
def list_goals(
    status: Optional[str] = Query(None, description="Filter by goal status (active, completed, paused, cancelled)"),
    goal_type: Optional[str] = Query(None, description="Filter by goal category/type"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high)"),
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Page size (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists financial goals owned exclusively by the authenticated user with optional filters
    and pagination. Each goal includes its deterministic derived calculation state.
    """
    cleaned_status = status.strip().lower() if status else None
    if cleaned_status and cleaned_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status filter '{status}'. Must be one of: {sorted(VALID_STATUSES)}",
        )

    cleaned_goal_type = goal_type.strip().lower() if goal_type else None
    if cleaned_goal_type and cleaned_goal_type not in VALID_GOAL_TYPES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid goal_type filter '{goal_type}'. Must be one of: {sorted(VALID_GOAL_TYPES)}",
        )

    cleaned_priority = priority.strip().lower() if priority else None
    if cleaned_priority and cleaned_priority not in VALID_PRIORITIES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority filter '{priority}'. Must be one of: {sorted(VALID_PRIORITIES)}",
        )

    return GoalService.list_user_goals_with_derived_state(
        db=db,
        user_id=current_user.id,
        status_filter=cleaned_status,
        goal_type_filter=cleaned_goal_type,
        priority_filter=cleaned_priority,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{goal_id}",
    response_model=FinancialGoalWithDerivedState,
    status_code=http_status.HTTP_200_OK,
    summary="Get Financial Goal Details by ID",
)
def get_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves details and deterministic derived calculation state for a specific financial goal.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    goal = GoalService.get_goal_with_derived_state(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
    )
    if not goal:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found.",
        )
    return goal


@router.patch(
    "/{goal_id}",
    response_model=FinancialGoalWithDerivedState,
    status_code=http_status.HTTP_200_OK,
    summary="Update Financial Goal Details",
)
def update_goal(
    goal_id: uuid.UUID,
    payload: FinancialGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates mutable properties of a financial goal.
    Enforces strict ownership verification and returns the goal with freshly recalculated derived state.
    """
    goal = GoalService.update_user_goal_with_derived_state(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
        payload=payload,
    )
    if not goal:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found.",
        )
    return goal


@router.delete(
    "/{goal_id}",
    response_model=MessageResponse,
    status_code=http_status.HTTP_200_OK,
    summary="Delete Financial Goal",
)
def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a financial goal owned by the authenticated user.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    deleted = GoalService.delete_user_goal(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found.",
        )
    return MessageResponse(message="Financial goal successfully deleted.")


# ===========================================================================
# Goal Contribution Ledger Endpoints (Phase 4A Part 3)
# ===========================================================================

@router.post(
    "/{goal_id}/contributions",
    response_model=GoalContributionRead,
    status_code=http_status.HTTP_201_CREATED,
    summary="Record New Goal Contribution",
)
def create_goal_contribution(
    goal_id: uuid.UUID,
    payload: GoalContributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Records an immutable contribution ledger entry for a user's financial goal.
    Enforces strict user ownership, positive amount validation, and ensures total
    contributions do not exceed the goal's target amount.
    """
    return GoalContributionService.create_contribution(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
        payload=payload,
    )


@router.get(
    "/{goal_id}/contributions",
    response_model=List[GoalContributionRead],
    status_code=http_status.HTTP_200_OK,
    summary="List All Contributions for a Financial Goal",
)
def list_goal_contributions(
    goal_id: uuid.UUID,
    start_date: Optional[date] = Query(None, description="Filter contributions on or after this date"),
    end_date: Optional[date] = Query(None, description="Filter contributions on or before this date"),
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Page size (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists contribution ledger entries for a financial goal owned by the authenticated user.
    Results are sorted by contribution_date DESC, created_at DESC.
    """
    return GoalContributionService.list_contributions(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{goal_id}/contributions/{contribution_id}",
    response_model=GoalContributionRead,
    status_code=http_status.HTTP_200_OK,
    summary="Get Specific Contribution Details",
)
def get_goal_contribution(
    goal_id: uuid.UUID,
    contribution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves details for a specific contribution ledger record.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    contribution = GoalContributionService.get_contribution(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
        contribution_id=contribution_id,
    )
    if not contribution:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Contribution not found.",
        )
    return contribution


@router.delete(
    "/{goal_id}/contributions/{contribution_id}",
    response_model=MessageResponse,
    status_code=http_status.HTTP_200_OK,
    summary="Delete Goal Contribution Record",
)
def delete_goal_contribution(
    goal_id: uuid.UUID,
    contribution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a contribution ledger entry owned by the authenticated user.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    deleted = GoalContributionService.delete_contribution(
        db=db,
        user_id=current_user.id,
        goal_id=goal_id,
        contribution_id=contribution_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Contribution not found.",
        )
    return MessageResponse(message="Contribution successfully deleted.")


