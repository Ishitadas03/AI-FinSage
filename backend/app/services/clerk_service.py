"""
Clerk Backend API Service for Identity & Lifecycle Management.
"""
import logging
from typing import Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class ClerkService:
    @staticmethod
    def is_configured() -> bool:
        return bool(settings.CLERK_SECRET_KEY)

    @staticmethod
    def delete_clerk_user_sync(clerk_user_id: str) -> bool:
        """
        Deletes a user identity from Clerk via Clerk Backend API.
        Idempotent: if Clerk returns 404 (user already deleted), returns True.
        Raises RuntimeError on network or API failures to prevent inconsistent identity states.
        """
        if not settings.CLERK_SECRET_KEY:
            logger.warning(
                f"CLERK_SECRET_KEY not configured. Skipping remote Clerk deletion for {clerk_user_id}."
            )
            return True

        url = f"https://api.clerk.com/v1/users/{clerk_user_id}"
        headers = {
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.delete(url, headers=headers)
                if res.status_code in (200, 204):
                    logger.info(f"Successfully deleted Clerk user {clerk_user_id}.")
                    return True
                elif res.status_code == 404:
                    logger.info(f"Clerk user {clerk_user_id} already deleted (404 Not Found). Idempotent success.")
                    return True
                else:
                    logger.error(
                        f"Clerk user deletion failed for {clerk_user_id}. Status: {res.status_code}, Body: {res.text}"
                    )
                    raise RuntimeError(f"Clerk API error ({res.status_code}): {res.text}")
        except httpx.RequestError as e:
            logger.error(f"Network error communicating with Clerk API during user deletion: {e}")
            raise RuntimeError(f"Failed to reach Clerk authentication service: {e}")


clerk_service = ClerkService()
