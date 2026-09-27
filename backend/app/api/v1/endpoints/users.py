"""
Users & Profile API Endpoints (Phase 5).

Provides authenticated, persistent user profile management with strict identity protection.
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserProfileUpdate
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["Users & Profile"])


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile and preferences",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Returns persistent profile and settings for the authenticated user."""
    return current_user


@router.patch(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Update application-managed profile fields",
)
def update_current_user_profile(
    payload: UserProfileUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates application-managed profile fields (phone, pan_number, currency, monthly_income, risk_appetite, preferences).
    Trusted identity fields (email, clerk_user_id) are protected and cannot be altered here.
    """
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    updated_user = user_service.update_user_profile(
        db=db,
        user_id=current_user.id,
        payload=payload,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    return updated_user
