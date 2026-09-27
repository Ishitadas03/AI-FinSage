from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
    NotificationBatchMarkReadRequest,
    NotificationGenerateResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List notifications for current user",
)
def list_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    limit: int = Query(50, ge=1, le=200, description="Max notifications to retrieve"),
    auto_generate: bool = Query(True, description="Automatically generate due bill alerts"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if auto_generate:
        NotificationService.generate_due_bill_notifications(db=db, user_id=current_user.id)

    return NotificationService.list_notifications(
        db=db,
        user_id=current_user.id,
        is_read=is_read,
        limit=limit,
    )


@router.post(
    "",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a custom notification",
)
def create_notification(
    payload: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark single notification as read",
)
def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return NotificationService.mark_as_read(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )


@router.post(
    "/mark-all-read",
    status_code=status.HTTP_200_OK,
    summary="Mark all or selected notifications as read",
)
def mark_all_notifications_as_read(
    payload: Optional[NotificationBatchMarkReadRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ids = payload.notification_ids if payload else None
    count = NotificationService.mark_all_as_read(
        db=db,
        user_id=current_user.id,
        notification_ids=ids,
    )
    return {
        "message": f"{count} notifications marked as read.",
        "count": count,
    }


@router.post(
    "/generate-alerts",
    response_model=NotificationGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan and generate upcoming / overdue bill alerts",
)
def generate_bill_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = NotificationService.generate_due_bill_notifications(
        db=db,
        user_id=current_user.id,
    )
    return NotificationGenerateResponse(
        generated_count=count,
        message=f"Generated {count} new bill notifications.",
    )


@router.delete(
    "/{notification_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a notification",
)
def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    NotificationService.delete_notification(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )
    return MessageResponse(message="Notification deleted successfully.")
