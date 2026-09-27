from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


VALID_NOTIFICATION_TYPES = {
    "bill_upcoming",
    "bill_overdue",
    "bill_paid",
    "security",
    "goal",
    "insight",
    "budget_alert",
    "system",
}


class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Notification title")
    message: str = Field(..., min_length=1, description="Notification text body")
    type: str = Field(default="system", description="Notification category/type")
    reference_id: Optional[str] = Field(None, max_length=255, description="Optional entity reference (e.g. bill_id:due_date)")
    is_read: bool = Field(default=False, description="Initial read state")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Notification title cannot be empty or whitespace.")
        return cleaned

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_NOTIFICATION_TYPES:
            raise ValueError(f"Invalid notification type '{v}'. Must be one of: {sorted(VALID_NOTIFICATION_TYPES)}")
        return cleaned


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    reference_id: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int


class NotificationBatchMarkReadRequest(BaseModel):
    notification_ids: Optional[List[uuid.UUID]] = Field(None, description="List of IDs to mark read. If empty/omitted, marks all unread notifications as read.")


class NotificationGenerateResponse(BaseModel):
    generated_count: int
    message: str
