import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="General API Health Check")
def health_check():
    """
    Returns basic application health status, environment, and current UTC timestamp.
    """
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/db", summary="Database Connectivity Health Check")
def database_health_check(db: Session = Depends(get_db)):
    """
    Executes a SELECT 1 ping against the PostgreSQL database to verify connection health and latency.
    """
    start_time = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "healthy",
            "database": "postgresql",
            "connected": True,
            "latency_ms": latency_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "database": "postgresql",
                "connected": False,
                "error": str(exc),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
