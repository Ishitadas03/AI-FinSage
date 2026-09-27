"""
User Profile Management Service (Phase 5).

Provides persistent profile reading and updating with strict identity protection
and automated audit logging.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import UserProfileUpdate, UserRead
from app.services.audit_log_service import audit_log_service

logger = logging.getLogger(__name__)


class UserService:
    @staticmethod
    def get_user_profile(db: Session, user_id: uuid.UUID) -> User:
        """Retrieves user record by ID or raises 404."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found.",
            )
        return user

    @staticmethod
    def update_user_profile(
        db: Session,
        user_id: uuid.UUID,
        payload: UserProfileUpdate,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> User:
        """
        Updates application-managed profile fields.
        Trusted identity fields (email, clerk_user_id, id) cannot be modified through this method.
        """
        user = UserService.get_user_profile(db, user_id)
        updated_fields = []

        if payload.full_name is not None and payload.full_name.strip():
            user.full_name = payload.full_name.strip()
            updated_fields.append("full_name")

        if payload.phone is not None:
            user.phone = payload.phone.strip() if payload.phone.strip() else None
            updated_fields.append("phone")

        if payload.pan_number is not None:
            user.pan_number = payload.pan_number
            updated_fields.append("pan_number")

        if payload.currency is not None:
            user.currency = payload.currency
            updated_fields.append("currency")

        if payload.monthly_income is not None:
            user.monthly_income = payload.monthly_income
            updated_fields.append("monthly_income")

        if payload.risk_appetite is not None and payload.risk_appetite.strip():
            user.risk_appetite = payload.risk_appetite.strip()
            updated_fields.append("risk_appetite")

        if payload.preferences is not None:
            merged_preferences = dict(user.preferences or {})
            merged_preferences.update(payload.preferences)
            user.preferences = merged_preferences
            updated_fields.append("preferences")

        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        # Audit log the profile update
        if updated_fields:
            audit_log_service.log_action(
                db=db,
                user_id=user.id,
                action="PROFILE_UPDATED",
                category="profile",
                ip_address=ip_address,
                user_agent=user_agent,
                details={"updated_fields": updated_fields},
            )

        return user


user_service = UserService()
