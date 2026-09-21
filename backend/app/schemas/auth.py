from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, description="User's full legal or preferred name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Strong account password (minimum 8 characters)")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT Bearer access token")
    refresh_token: str = Field(..., description="JWT refresh token for session renewal")
    token_type: str = Field(default="bearer", description="Token authentication type")
    expires_in: int = Field(..., description="Access token expiration window in seconds")
    user: UserRead = Field(..., description="Authenticated user profile data")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid JWT refresh token")


class LogoutRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token to invalidate/revoke")


class MessageResponse(BaseModel):
    message: str = Field(..., description="Status or result message")
