import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


def mask_pan(pan: Optional[str]) -> Optional[str]:
    """Masks PAN number to protect sensitive tax identification data (e.g., XXXXXX1234F)."""
    if not pan:
        return None
    cleaned = pan.strip().upper()
    if len(cleaned) == 10:
        return f"XXXXXX{cleaned[-4:]}"
    elif len(cleaned) > 4:
        return f"{'X' * (len(cleaned) - 4)}{cleaned[-4:]}"
    return "XXXX"


class UserBase(BaseModel):
    full_name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserProfileUpdate(BaseModel):
    """Payload for updating application-managed profile and preference fields."""
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    pan_number: Optional[str] = Field(None, max_length=20)
    currency: Optional[str] = Field(None, max_length=10)
    monthly_income: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    risk_appetite: Optional[str] = Field(None, max_length=50)
    preferences: Optional[Dict[str, Any]] = None

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().upper()
            if not cleaned:
                return None
            if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", cleaned):
                raise ValueError("Invalid PAN format. Must match standard 10-character format (e.g. ABCDE1234F).")
            return cleaned
        return None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().upper()
            return cleaned if cleaned else "INR"
        return None


class UserDeleteRequest(BaseModel):
    """Explicit confirmation payload for permanent account and financial data deletion."""
    confirm_email: EmailStr = Field(..., description="User email for identity confirmation")
    confirmation_text: str = Field(..., description="Must be exactly 'DELETE MY ACCOUNT'")
    reason: Optional[str] = Field(None, max_length=500, description="Optional deletion reason / feedback")

    @field_validator("confirmation_text")
    @classmethod
    def validate_confirmation(cls, v: str) -> str:
        if v.strip() != "DELETE MY ACCOUNT":
            raise ValueError("confirmation_text must be exactly 'DELETE MY ACCOUNT'")
        return v.strip()


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clerk_user_id: Optional[str] = None
    phone: Optional[str] = None
    pan_number: Optional[str] = None
    currency: str = "INR"
    monthly_income: Optional[Decimal] = None
    risk_appetite: str = "Moderate"
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("pan_number", mode="before")
    @classmethod
    def mask_pan_field(cls, v: Optional[str]) -> Optional[str]:
        return mask_pan(v)
