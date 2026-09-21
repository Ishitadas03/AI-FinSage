import uuid
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token, create_refresh_token

client = TestClient(app)


@pytest.fixture
def unique_user_data():
    uid = uuid.uuid4().hex[:8]
    return {
        "full_name": f"FinSage Test User {uid}",
        "email": f"test_{uid}@example.com",
        "password": "SecurePassword123!",
    }


def test_successful_registration(unique_user_data):
    response = client.post("/api/v1/auth/register", json=unique_user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_user_data["email"]
    assert data["full_name"] == unique_user_data["full_name"]
    assert "id" in data
    assert "created_at" in data
    assert "password_hash" not in data
    assert "password" not in data


def test_duplicate_registration_rejection(unique_user_data):
    # First registration
    res1 = client.post("/api/v1/auth/register", json=unique_user_data)
    assert res1.status_code == 201

    # Duplicate registration attempt with same email
    res2 = client.post("/api/v1/auth/register", json=unique_user_data)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_successful_login(unique_user_data):
    # Register first
    client.post("/api/v1/auth/register", json=unique_user_data)

    # Login
    login_payload = {
        "email": unique_user_data["email"],
        "password": unique_user_data["password"],
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_user_data["email"]
    assert "password_hash" not in data["user"]


def test_login_wrong_password(unique_user_data):
    client.post("/api/v1/auth/register", json=unique_user_data)

    login_payload = {
        "email": unique_user_data["email"],
        "password": "IncorrectPassword999!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_login_nonexistent_email():
    login_payload = {
        "email": "nonexistent_user_99999@example.com",
        "password": "AnyPassword123!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


def test_auth_me_with_valid_token(unique_user_data):
    client.post("/api/v1/auth/register", json=unique_user_data)
    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_user_data["email"],
        "password": unique_user_data["password"],
    })
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_user_data["email"]
    assert data["full_name"] == unique_user_data["full_name"]
    assert "password_hash" not in data


def test_auth_me_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_auth_me_with_invalid_token():
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_gibberish_jwt_token"},
    )
    assert response.status_code == 401


def test_auth_me_with_expired_token(unique_user_data):
    reg_res = client.post("/api/v1/auth/register", json=unique_user_data)
    user_id = reg_res.json()["id"]

    # Generate token already expired 5 minutes ago
    expired_token = create_access_token(
        subject=user_id,
        expires_delta=timedelta(minutes=-5),
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_refresh_token_flow(unique_user_data):
    client.post("/api/v1/auth/register", json=unique_user_data)
    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_user_data["email"],
        "password": unique_user_data["password"],
    })
    refresh_token = login_res.json()["refresh_token"]

    # Refresh session
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["access_token"] != login_res.json()["access_token"]
    assert data["user"]["email"] == unique_user_data["email"]


def test_logout_and_revocation_flow(unique_user_data):
    client.post("/api/v1/auth/register", json=unique_user_data)
    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_user_data["email"],
        "password": unique_user_data["password"],
    })
    refresh_token = login_res.json()["refresh_token"]

    # Logout
    logout_res = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout_res.status_code == 200
    assert "revoked" in logout_res.json()["message"].lower()

    # Attempting to refresh with revoked token must fail with 401
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 401
    assert "revoked" in refresh_res.json()["detail"].lower()
