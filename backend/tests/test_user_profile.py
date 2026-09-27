import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.security import create_access_token


@pytest.fixture
def auth_headers(test_user: User):
    token = create_access_token(subject=test_user.id)
    return {"Authorization": f"Bearer {token}"}


def test_get_user_profile_unauthorized(client: TestClient):
    """Verify unauthorized request to /users/me returns 401."""
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401


def test_get_user_profile_success(client: TestClient, test_user: User, auth_headers):
    """Verify authenticated user can retrieve their persistent profile."""
    res = client.get("/api/v1/users/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(test_user.id)
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name
    assert data["currency"] == "INR"


def test_update_user_profile_success(client: TestClient, db: Session, test_user: User, auth_headers):
    """Verify updating application-managed profile fields."""
    payload = {
        "full_name": "Dr. Alex Mercer",
        "phone": "+91 9876543210",
        "pan_number": "abcde1234f",
        "currency": "usd",
        "monthly_income": 125000.50,
        "risk_appetite": "Aggressive",
        "preferences": {"notifications": {"email": True, "sms": False}, "theme": "dark"},
    }

    res = client.patch("/api/v1/users/me", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Dr. Alex Mercer"
    assert data["phone"] == "+91 9876543210"
    assert data["pan_number"] == "ABCDE1234F"  # Auto-uppercased
    assert data["currency"] == "USD"  # Auto-uppercased
    assert float(data["monthly_income"]) == 125000.50
    assert data["risk_appetite"] == "Aggressive"
    assert data["preferences"]["theme"] == "dark"

    # Verify audit log was created
    audit_entry = db.query(AuditLog).filter(
        AuditLog.user_id == test_user.id,
        AuditLog.action == "PROFILE_UPDATED",
    ).first()
    assert audit_entry is not None
    assert "updated_fields" in audit_entry.details


def test_update_user_profile_protected_identity_fields(client: TestClient, test_user: User, auth_headers):
    """Verify client cannot tamper with email or clerk_user_id through profile update endpoint."""
    original_email = test_user.email
    payload = {
        "email": "hacked@evil.com",
        "clerk_user_id": "clerk_hacked_123",
        "full_name": "Legit Name",
    }

    res = client.patch("/api/v1/users/me", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == original_email  # Remains untouched
    assert data["full_name"] == "Legit Name"
