from datetime import datetime
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Spending & Income Analytics Overview",
)
def get_analytics_overview(
    start_date: Optional[datetime] = Query(
        None,
        description="Start date/time (defaults to start of current calendar month)",
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="End date/time (defaults to end of current calendar month)",
    ),
    account_id: Optional[uuid.UUID] = Query(
        None,
        description="Filter analytics for a specific financial account",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns deterministic spending analytics, category breakdowns, account metrics,
    time-series trends, and top expenses for the authenticated user.
    Inter-account transfers are strictly excluded from income and expenses.
    """
    return AnalyticsService.get_analytics_overview(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
    )
