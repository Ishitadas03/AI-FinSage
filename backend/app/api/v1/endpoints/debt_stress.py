"""
Debt Stress Analyzer API endpoint (Phase 3D-5 Part 2).

Thin API layer that exposes DebtStressService.analyze() through a
protected GET endpoint. All calculation logic lives in the service layer.
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.debt_stress import DebtStressAnalysisResponse
from app.services.debt_stress_service import DebtStressService

router = APIRouter(prefix="/debt-stress", tags=["Debt Stress"])


@router.get(
    "/overview",
    response_model=DebtStressAnalysisResponse,
    summary="Get Deterministic Debt Stress Analysis",
    description=(
        "Returns a deterministic debt stress analysis for the authenticated user, "
        "including debt summary, cash-flow pressure, debt burden metrics, "
        "stress indicators, and data completeness notes. "
        "All calculations are grounded strictly in verified loans, credit cards, "
        "and transaction history."
    ),
)
def get_debt_stress_overview(
    start_date: Optional[date] = Query(None, description="Start date for transaction analysis window (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for transaction analysis window (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DebtStressAnalysisResponse:
    return DebtStressService.analyze(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )
