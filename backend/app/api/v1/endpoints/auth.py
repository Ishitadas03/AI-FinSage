from datetime import datetime, timedelta, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
import jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limiter import auth_rate_limiter
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
)
from app.models.user import User
from app.models.refresh_session import RefreshSession
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    LogoutRequest,
    MessageResponse,
)
from app.schemas.user import UserRead
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Registers a new user account with Argon2id password hashing.
    Normalizes the email address and checks for uniqueness.
    Never returns or exposes the password hash.
    """
    auth_rate_limiter.check_rate_limit(request)
    normalized_email = payload.email.lower().strip()

    # Check for existing user by email
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Hash password using Argon2id
    hashed_password = get_password_hash(payload.password)

    # Create new User record
    new_user = User(
        id=uuid.uuid4(),
        full_name=payload.full_name.strip(),
        email=normalized_email,
        password_hash=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate User and Issue JWT Tokens",
)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticates a user with email and password.
    Issues a short-lived JWT access token and a long-lived JWT refresh token.
    Records the refresh token session in PostgreSQL for revocation management.
    """
    auth_rate_limiter.check_rate_limit(request)
    normalized_email = payload.email.lower().strip()

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Record refresh session in database
    token_h = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_session = RefreshSession(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=token_h,
        expires_at=expires_at,
        is_revoked=False,
    )
    db.add(refresh_session)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated User Profile",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the safe profile of the currently authenticated user based on the Bearer JWT token.
    """
    return current_user


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token Session",
)
def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Validates a JWT refresh token, checks the PostgreSQL session record,
    revokes the old token, and issues a fresh access & rotated refresh token pair.
    """
    raw_token = payload.refresh_token
    try:
        token_payload = decode_token(raw_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check database session record
    token_h = hash_token(raw_token)
    session_record = db.query(RefreshSession).filter(RefreshSession.token_hash == token_h).first()

    now = datetime.now(timezone.utc)
    expires_at = session_record.expires_at if session_record else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not session_record or session_record.is_revoked or (expires_at and expires_at < now):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token session has been revoked or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == session_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this refresh session was not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Revoke old refresh session (Rotation)
    session_record.is_revoked = True

    # Generate new pair
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    # Store new session
    new_token_h = hash_token(new_refresh_token)
    new_expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_session = RefreshSession(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=new_token_h,
        expires_at=new_expires_at,
        is_revoked=False,
    )
    db.add(new_session)
    db.commit()

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke Active Refresh Token Session",
)
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
):
    """
    Revokes the provided refresh token session in PostgreSQL, preventing future token renewals.
    """
    token_h = hash_token(payload.refresh_token)
    session_record = db.query(RefreshSession).filter(RefreshSession.token_hash == token_h).first()

    if session_record:
        session_record.is_revoked = True
        db.commit()

    return MessageResponse(message="Session successfully revoked and logged out.")
