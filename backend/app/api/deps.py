import uuid
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

# HTTP Bearer token extractor
bearer_scheme = HTTPBearer(auto_error=False)

# Cached JWKS client for Clerk tokens if configured
_clerk_jwks_client: Optional[PyJWKClient] = None

def get_clerk_jwks_client() -> Optional[PyJWKClient]:
    global _clerk_jwks_client
    if _clerk_jwks_client is None and settings.CLERK_ISSUER_URL:
        issuer = settings.CLERK_ISSUER_URL.rstrip("/")
        jwks_url = f"{issuer}/.well-known/jwks.json"
        _clerk_jwks_client = PyJWKClient(jwks_url)
    return _clerk_jwks_client


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that extracts, decodes, and validates the JWT Bearer access token
    (supporting both Clerk RS256 JWT tokens and FinSage Internal HS256 JWT tokens)
    and returns the authenticated User instance.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = None
    is_clerk_token = False

    # Check unverified header to detect Clerk RS256 token
    try:
        unverified_header = jwt.get_unverified_header(token)
        if unverified_header.get("alg") == "RS256" or settings.CLERK_ISSUER_URL:
            client = get_clerk_jwks_client()
            if client:
                signing_key = client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
                is_clerk_token = True
    except Exception:
        pass

    # Fallback to internal HS256 verification if not verified via Clerk
    if not payload:
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token has expired. Please refresh your session.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except (jwt.InvalidTokenError, Exception):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not is_clerk_token:
        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type for authorization. Expected access token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing subject.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            user_uuid = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject format.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with this token no longer exists.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if getattr(user, "status", "active") != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is currently suspended or scheduled for permanent deletion.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    # Handle Clerk authenticated user lookup & JIT provisioning
    clerk_id = payload.get("sub")
    email = payload.get("email") or payload.get("primary_email")
    email_verified = payload.get("email_verified")

    if not clerk_id and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Clerk token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = None
    if clerk_id:
        user = db.query(User).filter(User.clerk_user_id == clerk_id).first()

    if not user and email:
        # Check if an existing account exists with this email
        existing_user = db.query(User).filter(User.email == email.lower().strip()).first()
        if existing_user:
            # Prevent account takeover: only link if email is verified in Clerk
            if email_verified is False:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email address in Clerk before linking your account.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            user = existing_user

    if not user:
        # Just-In-Time (JIT) creation for new Clerk user
        user = User(
            id=uuid.uuid4(),
            clerk_user_id=clerk_id,
            email=email.lower().strip() if email else f"{clerk_id}@clerk.user",
            full_name=payload.get("name") or (email.split("@")[0] if email else "Clerk User"),
            password_hash=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif clerk_id and not user.clerk_user_id:
        # Link Clerk ID to existing local user account
        user.clerk_user_id = clerk_id
        db.commit()

    if getattr(user, "status", "active") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently suspended or scheduled for permanent deletion.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
