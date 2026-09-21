import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import uuid
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from app.core.config import settings

# Initialize Argon2 Password Hasher with OWASP recommended parameters
_ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MB
    parallelism=1,
    hash_len=32,
    salt_len=16,
)


def get_password_hash(password: str) -> str:
    """
    Hashes a plain-text password using the Argon2id algorithm.
    """
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against an Argon2 hash in constant time.
    """
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def hash_token(token: str) -> str:
    """
    Generates a deterministic SHA-256 hash of a token for indexing and fast lookup in the database.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: Union[str, uuid.UUID],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generates a signed JWT access token with expiration and subject claims.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, uuid.UUID],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generates a signed JWT refresh token with extended validity.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4()),  # Unique JWT ID for tracking
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a signed JWT token against the secret and algorithm.
    Raises PyJWT exceptions (ExpiredSignatureError, InvalidTokenError) on invalidity.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
