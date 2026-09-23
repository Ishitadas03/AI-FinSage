"""
Financial Budgets API Endpoints (Phase 4B Part 2).

Protected REST API endpoints for financial budget management and real-time spending tracking.
Enforces strict user ownership, input validation, and deterministic spending metrics.
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
from app.schemas.budgets import (
    BudgetCreate,
    BudgetSpendingSummary,
    BudgetUpdate,
    BudgetWithSpending,
    VALID_BUDGET_CATEGORIES,
    VALID_BUDGET_PERIODS,
)
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post(
    "",
    response_model=BudgetWithSpending,
    status_code=http_status.HTTP_201_CREATED,
    summary="Create New Financial Budget",
)
def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new category budget strictly tied to the authenticated user.
    Returns the created budget enriched with its initial calculated spending summary.
    """
    return BudgetService.create_budget_with_spending(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )


@router.get(
    "",
    response_model=List[BudgetWithSpending],
    status_code=http_status.HTTP_200_OK,
    summary="List All Budgets for Current User",
)
def list_budgets(
    category: Optional[str] = Query(None, description="Filter by budget category"),
    period: Optional[str] = Query(None, description="Filter by budget period (monthly, weekly)"),
    start_date: Optional[date] = Query(None, description="Filter budgets with start_date >= date"),
    end_date: Optional[date] = Query(None, description="Filter budgets with end_date <= date"),
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Page size (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists budgets owned exclusively by the authenticated user with optional filters
    and pagination. Each budget includes its real-time deterministic spending summary.
    """
    cleaned_category = category.strip().lower() if category else None
    if cleaned_category and cleaned_category not in VALID_BUDGET_CATEGORIES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category filter '{category}'. Must be one of: {sorted(VALID_BUDGET_CATEGORIES)}",
        )

    cleaned_period = period.strip().lower() if period else None
    if cleaned_period and cleaned_period not in VALID_BUDGET_PERIODS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid period filter '{period}'. Must be one of: {sorted(VALID_BUDGET_PERIODS)}",
        )

    return BudgetService.list_user_budgets_with_spending(
        db=db,
        user_id=current_user.id,
        category=cleaned_category,
        period=cleaned_period,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{budget_id}",
    response_model=BudgetWithSpending,
    status_code=http_status.HTTP_200_OK,
    summary="Get Budget Details by ID",
)
def get_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves details and real-time spending metrics for a specific budget.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    budget = BudgetService.get_user_budget_with_spending(
        db=db,
        user_id=current_user.id,
        budget_id=budget_id,
    )
    if not budget:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial budget not found.",
        )
    return budget


@router.patch(
    "/{budget_id}",
    response_model=BudgetWithSpending,
    status_code=http_status.HTTP_200_OK,
    summary="Update Budget Details",
)
def update_budget(
    budget_id: uuid.UUID,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates mutable properties of a budget.
    Enforces strict ownership verification and returns the budget with recalculated spending metrics.
    """
    budget = BudgetService.update_user_budget_with_spending(
        db=db,
        user_id=current_user.id,
        budget_id=budget_id,
        payload=payload,
    )
    if not budget:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial budget not found.",
        )
    return budget


@router.delete(
    "/{budget_id}",
    response_model=MessageResponse,
    status_code=http_status.HTTP_200_OK,
    summary="Delete Budget",
)
def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a budget owned by the authenticated user.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    deleted = BudgetService.delete_user_budget(
        db=db,
        user_id=current_user.id,
        budget_id=budget_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial budget not found.",
        )
    return MessageResponse(message="Budget successfully deleted.")


@router.get(
    "/{budget_id}/spending",
    response_model=BudgetSpendingSummary,
    status_code=http_status.HTTP_200_OK,
    summary="Get Budget Spending Summary",
)
def get_budget_spending(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns only the deterministic spending summary for a user's budget.
    Enforces strict ownership verification; returns 404 if not found or unauthorized.
    """
    budget = BudgetService.get_user_budget(
        db=db,
        user_id=current_user.id,
        budget_id=budget_id,
    )
    if not budget:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Financial budget not found.",
        )

    return BudgetService.calculate_budget_spending(
        db=db,
        user_id=current_user.id,
        category=budget.category,
        start_date=budget.start_date,
        end_date=budget.end_date,
        budget_amount=budget.amount,
        budget_id=budget.id,
        budget_name=budget.name,
    )
