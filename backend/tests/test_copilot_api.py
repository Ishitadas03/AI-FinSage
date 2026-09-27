"""
API Tests for Grounded AI Copilot endpoints (Phase 4).
"""
import pytest
from decimal import Decimal
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.models.account import Account


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(db):
    user = User(
        id=uuid.uuid4(),
        email=f"copilot_api_user_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Copilot API Tester",
        password_hash="fakehash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_copilot_chat_endpoint_unauthorized(client: TestClient):
    """Verify unauthenticated request is rejected with 401."""
    response = client.post("/api/v1/copilot/chat", json={"message": "What is my balance?"})
    assert response.status_code == 401


def test_copilot_chat_endpoint_authenticated(client: TestClient, db, test_user):
    """Verify authenticated user receives grounded structured response."""
    token = create_access_token(subject=test_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    acc = Account(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Salary Account",
        account_type="savings",
        balance=Decimal("80000.00"),
        currency="INR",
    )
    db.add(acc)
    db.commit()

    response = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "How much money do I have in my accounts?"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert "content" in data
    assert len(data["content"]) > 10
    assert "metrics_snapshot" in data
    assert data["metrics_snapshot"]["net_worth"] == 80000.0
    assert len(data["suggested_queries"]) > 0


def test_copilot_history_and_clear_endpoints(client: TestClient, db, test_user):
    """Verify history listing and clearing endpoints."""
    token = create_access_token(subject=test_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Post a message first
    client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "Summarize my budgets"},
    )

    # Get history
    res_hist = client.get("/api/v1/copilot/history", headers=headers)
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert data_hist["total"] >= 2

    # Clear history
    res_del = client.delete("/api/v1/copilot/history", headers=headers)
    assert res_del.status_code == 200
    assert "cleared" in res_del.json()["message"].lower()

    # Verify history empty
    res_hist_after = client.get("/api/v1/copilot/history", headers=headers)
    assert res_hist_after.json()["total"] == 0
