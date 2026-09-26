import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings

def is_serverless_environment() -> bool:
    """Detect if running inside a serverless runtime (Vercel, AWS Lambda, or SERVERLESS=1)."""
    return bool(
        os.getenv("VERCEL")
        or os.getenv("SERVERLESS") == "1"
        or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    )


def get_engine_kwargs(
    database_url: str = settings.DATABASE_URL,
    is_serverless: bool | None = None,
) -> dict:
    """
    Build SQLAlchemy engine configuration dictionary.
    Uses NullPool under serverless environments (Vercel/Lambda) to prevent connection leaks,
    and QueuePool with connection recycling in persistent environments.
    """
    if is_serverless is None:
        is_serverless = is_serverless_environment()

    kwargs = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,
    }
    if database_url.startswith("postgresql"):
        kwargs["connect_args"] = {"connect_timeout": 10}
        if is_serverless:
            kwargs["poolclass"] = NullPool
        else:
            kwargs["pool_size"] = 10
            kwargs["max_overflow"] = 20
            kwargs["pool_recycle"] = 1800
    return kwargs


IS_SERVERLESS = is_serverless_environment()


engine_kwargs = get_engine_kwargs()
engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

# Create SessionLocal factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Automatically closes the session after the endpoint finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
