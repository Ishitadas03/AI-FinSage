import os
import sqlite3
from datetime import datetime
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, StaticPool
from app.core.config import settings

def is_serverless_environment() -> bool:
    """Detect if running inside a serverless runtime (Vercel, AWS Lambda, or SERVERLESS=1)."""
    return bool(
        os.getenv("VERCEL")
        or os.getenv("SERVERLESS") == "1"
        or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    )


def sqlite_to_char(val, fmt):
    if val is None:
        return ""
    if isinstance(val, str):
        try:
            val = datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            return val[:10] if fmt == "YYYY-MM-DD" else val[:7]
    if isinstance(val, datetime):
        if fmt == "YYYY-MM-DD":
            return val.strftime("%Y-%m-%d")
        elif fmt == "YYYY-MM":
            return val.strftime("%Y-%m")
    return str(val)


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


def create_db_engine():
    target_url = settings.DATABASE_URL
    kwargs = get_engine_kwargs(target_url)

    try:
        eng = create_engine(target_url, **kwargs)
        if target_url.startswith("postgresql") and "pytest" not in sys.modules:
            with eng.connect() as conn:
                pass
        return eng
    except Exception as err:
        if settings.ENVIRONMENT == "development" and target_url.startswith("postgresql"):
            print(f"[DATABASE WARNING] Unable to connect to local PostgreSQL ({err}). Falling back to local SQLite database (sqlite:///./finsage_dev.db)...")
            sqlite_url = "sqlite:///./finsage_dev.db"
            eng = create_engine(
                sqlite_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            @event.listens_for(eng, "connect")
            def register_sqlite_func(dbapi_connection, connection_record):
                if isinstance(dbapi_connection, sqlite3.Connection):
                    dbapi_connection.create_function("to_char", 2, sqlite_to_char)
            
            # Ensure tables are created for SQLite fallback
            from app.models.base import Base
            Base.metadata.create_all(bind=eng)
            return eng
        raise err


engine = create_db_engine()

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
