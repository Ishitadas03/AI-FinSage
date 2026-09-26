import base64
import hashlib
import hmac
import json
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_clerk_signature(headers: Dict[str, str], raw_body: bytes, secret: str) -> bool:
    """
    Validates Clerk/Svix webhook HMAC-SHA256 signature against CLERK_WEBHOOK_SECRET.
    """
    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        return False

    secret_key = secret[6:] if secret.startswith("whsec_") else secret
    try:
        secret_bytes = base64.b64decode(secret_key)
    except Exception:
        secret_bytes = secret.encode("utf-8")

    to_sign = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + raw_body
    computed_signature = hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()
    computed_b64 = base64.b64encode(computed_signature).decode("utf-8")

    for sig_part in svix_signature.split(" "):
        if "," in sig_part:
            version, sig = sig_part.split(",", 1)
            if version == "v1" and hmac.compare_digest(sig, computed_b64):
                return True
    return False


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
    Validates HMAC signatures if CLERK_WEBHOOK_SECRET is configured.
    Syncs user profile state and handles cascading cleanup upon account deletion.
    """
    raw_body = await request.body()

    if settings.CLERK_WEBHOOK_SECRET:
        headers_dict = {k.lower(): v for k, v in request.headers.items()}
        if not verify_clerk_signature(headers_dict, raw_body, settings.CLERK_WEBHOOK_SECRET):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Clerk webhook signature.",
            )

    try:
        body: Dict[str, Any] = json.loads(raw_body.decode("utf-8"))
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
            # Check if primary email is verified in Clerk before linking
            is_verified = False
            for email_obj in email_addresses:
                if email_obj.get("email_address") == primary_email:
                    verification_status = email_obj.get("verification", {}).get("status")
                    if verification_status == "verified":
                        is_verified = True
                    break

            existing_user = db.query(User).filter(User.email == primary_email.lower().strip()).first()
            if existing_user:
                if is_verified:
                    user = existing_user
                else:
                    # Do not link unverified email to existing account to prevent account takeover
                    user = None

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
