from datetime import date
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.financial_health import FinancialHealthOverviewResponse
from app.services.financial_health_service import FinancialHealthService

router = APIRouter(prefix="/financial-health", tags=["Financial Health"])


@router.get(
    "/overview",
    response_model=FinancialHealthOverviewResponse,
    summary="Get Deterministic Financial Health Overview",
    description=(
        "Returns deterministic financial health metrics grounded strictly in verified ledger balances "
        "and transaction history for the authenticated user."
    ),
)
def get_financial_health_overview(
    start_date: Optional[date] = Query(None, description="Start date for period cash flow calculations (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for period cash flow calculations (YYYY-MM-DD)"),
    account_id: Optional[uuid.UUID] = Query(None, description="Optional account ID filter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FinancialHealthOverviewResponse:
    return FinancialHealthService.get_financial_health_overview(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
    )
