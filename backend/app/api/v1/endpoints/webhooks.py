import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post(
    "/clerk",
    status_code=status.HTTP_200_OK,
    summary="Handle Clerk User Event Webhooks",
)
async def handle_clerk_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Processes incoming Clerk webhooks (user.created, user.updated, user.deleted).
    Syncs user profile state and handles cascading cleanup upon account deletion.
    """
    try:
        body: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload.")

    event_type = body.get("type")
    data = body.get("data", {})

    clerk_id = data.get("id")
    if not clerk_id:
        return {"status": "ignored", "reason": "No Clerk user ID in event data."}

    # Extract primary email address if available
    email_addresses = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")
    primary_email = None

    for email_obj in email_addresses:
        if email_obj.get("id") == primary_email_id:
            primary_email = email_obj.get("email_address")
            break
    if not primary_email and email_addresses:
        primary_email = email_addresses[0].get("email_address")

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    full_name = f"{first_name} {last_name}".strip() or (primary_email.split("@")[0] if primary_email else "Clerk User")

    if event_type in ("user.created", "user.updated"):
        user = db.query(User).filter(User.clerk_user_id == clerk_id).first()
        if not user and primary_email:
            user = db.query(User).filter(User.email == primary_email.lower().strip()).first()

        if not user:
            user = User(
                id=uuid.uuid4(),
                clerk_user_id=clerk_id,
                email=primary_email.lower().strip() if primary_email else f"{clerk_id}@clerk.user",
                full_name=full_name,
                password_hash=None,
            )
            db.add(user)
        else:
            user.clerk_user_id = clerk_id
            user.full_name = full_name
            if primary_email:
                user.email = primary_email.lower().strip()

        db.commit()
        return {"status": "success", "event": event_type, "user_id": str(user.id)}

    elif event_type == "user.deleted":
        user = db.query(User).filter(User.clerk_user_id == clerk_id).first()
        if user:
            db.delete(user)
            db.commit()
            return {"status": "success", "event": "user.deleted", "deleted_user_id": str(user.id)}
        return {"status": "ignored", "reason": "User not found locally."}

    return {"status": "ignored", "event": event_type}
