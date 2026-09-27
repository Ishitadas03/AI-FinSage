"""
Dynamic Monthly Financial Reports Endpoints (Phase 4).

Routes:
- GET /api/v1/reports/monthly
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.monthly_report import MonthlyFinancialReportResponse
from app.services.monthly_report_service import monthly_report_service

router = APIRouter()


@router.get(
    "/monthly",
    response_model=MonthlyFinancialReportResponse,
    summary="Generate dynamic monthly financial audit report",
    status_code=status.HTTP_200_OK,
)
def get_monthly_financial_report(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format (e.g. 2026-09)"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a grounded monthly financial audit report with period comparisons,
    budget utilization, category breakdowns, and action checklists.
    """
    return monthly_report_service.generate_monthly_report(
        db=db,
        user_id=current_user.id,
        month_str=month,
        start_date_str=start_date,
        end_date_str=end_date,
    )
