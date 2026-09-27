"""
Audit Logging Service (Phase 5).

Persists immutable security, data export, profile updates, and account lifecycle records.
Strictly user-isolated and sanitizes sensitive fields.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
import uuid
import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func

from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogRead, AuditLogListResponse

logger = logging.getLogger(__name__)


class AuditLogService:
    @staticmethod
    def log_action(
        db: Session,
        user_id: uuid.UUID,
        action: str,
        category: str = "general",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Optional[AuditLog]:
        """
        Creates an immutable audit log entry.
        Never throws unhandled exceptions to avoid blocking user workflows,
        while ensuring errors are logged.
        """
        try:
            # Ensure details contains no passwords, secret tokens, or sensitive PAN/card numbers
            sanitized_details = {}
            if details:
                scrub_keywords = ("password", "token", "secret", "key", "auth", "pan", "cvv", "card_number", "pin", "ssn", "tax_id")
                for k, v in details.items():
                    if any(kw in k.lower() for kw in scrub_keywords):
                        continue
                    sanitized_details[k] = v

            entry = AuditLog(
                id=uuid.uuid4(),
                user_id=user_id,
                action=action,
                category=category,
                ip_address=ip_address,
                user_agent=user_agent[:255] if user_agent else None,
                details=sanitized_details if sanitized_details else None,
            )
            db.add(entry)
            db.commit()
            db.refresh(entry)
            return entry
        except Exception as e:
            logger.error(f"Failed to write audit log entry for user {user_id}: {e}", exc_info=True)
            db.rollback()
            return None

    @staticmethod
    def list_user_logs(
        db: Session,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        category: Optional[str] = None,
    ) -> AuditLogListResponse:
        """
        Lists paginated audit logs for the authenticated user only.
        """
        query = select(AuditLog).where(AuditLog.user_id == user_id)
        if category:
            query = query.where(AuditLog.category == category)

        total = db.scalar(
            select(func.count(AuditLog.id)).where(AuditLog.user_id == user_id)
        ) or 0

        offset = (page - 1) * page_size
        logs = db.scalars(
            query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size)
        ).all()

        return AuditLogListResponse(
            logs=[AuditLogRead.model_validate(l) for l in logs],
            total=total,
            page=page,
            page_size=page_size,
        )


audit_log_service = AuditLogService()
