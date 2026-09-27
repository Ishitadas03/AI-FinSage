"""
Financial Data Management API Endpoints (Phase 5).

Provides user-initiated financial data exports (JSON, CSV Zip), audit trail inspection,
and explicit, confirmed account deletion with cascading ledger cleanup.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.data_management import (
    UserDataExportResponse,
    AccountDeletionResponse,
)
from app.schemas.audit_log import AuditLogListResponse
from app.schemas.user import UserDeleteRequest
from app.services.data_management_service import data_management_service
from app.services.audit_log_service import audit_log_service

router = APIRouter(prefix="/data-management", tags=["Data Management & Privacy"])


@router.get(
    "/export",
    summary="Export complete user financial records (JSON or CSV Zip)",
    status_code=status.HTTP_200_OK,
)
def export_user_data(
    format: str = Query("json", pattern="^(json|csv)$", description="Export format: json or csv"),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Exports all personal financial records for the authenticated user.
    Never includes credentials, internal tokens, or secrets.
    """
    client_ip = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None

    if format.lower() == "csv":
        zip_bytes = data_management_service.export_user_data_csv_zip(
            db=db,
            user=current_user,
            ip_address=client_ip,
            user_agent=user_agent,
        )
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="finsage_export_{current_user.id}.zip"'
            },
        )

    # JSON export
    export_data = data_management_service.export_user_data_json(
        db=db,
        user=current_user,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    return export_data


@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get user security and audit activity logs",
    status_code=status.HTTP_200_OK,
)
def list_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Optional category filter (e.g. profile, data_export, security)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns paginated audit log entries strictly scoped to the authenticated user."""
    return audit_log_service.list_user_logs(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        category=category,
    )


@router.post(
    "/delete-account",
    response_model=AccountDeletionResponse,
    summary="Permanently delete user account and all financial data",
    status_code=status.HTTP_200_OK,
)
def delete_account(
    payload: UserDeleteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently purges the authenticated user's account, accounts, transactions,
    budgets, goals, loans, recurring bills, and chat messages.
    Requires email identity match and confirmation phrase 'DELETE MY ACCOUNT'.
    """
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    result = data_management_service.delete_user_account(
        db=db,
        user=current_user,
        payload=payload,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    return result
