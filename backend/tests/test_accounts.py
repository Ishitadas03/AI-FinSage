import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper fixture/function to register and log in a unique user, returning user data and auth header."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"User {uid} {name_suffix}".strip(),
        "email": f"user_{uid}_{name_suffix.lower()}@example.com",
        "password": "SecurePassword123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()

    login_res = client.post("/api/v1/auth/login", json={
        "email": user_payload["email"],
        "password": user_payload["password"],
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user_data, "token": token, "headers": headers}


def test_authenticated_account_creation():
    user = register_and_login_user("creation")
    payload = {
        "name": "HDFC Salary Account",
        "account_type": "savings",
        "balance": "45000.50",
        "currency": "inr",
    }
    response = client.post("/api/v1/accounts", json=payload, headers=user["headers"])
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "HDFC Salary Account"
    assert data["account_type"] == "savings"
    assert Decimal(data["balance"]) == Decimal("45000.50")
    assert data["currency"] == "INR"
    assert data["user_id"] == user["user"]["id"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_unauthenticated_account_creation_rejected():
    payload = {
        "name": "Unauthorized Account",
        "account_type": "cash",
        "balance": "100.00",
        "currency": "INR",
    }
    response = client.post("/api/v1/accounts", json=payload)
    assert response.status_code == 401


def test_list_accounts_user_isolation():
    user_a = register_and_login_user("user_a")
    user_b = register_and_login_user("user_b")

    # Create 2 accounts for User A
    client.post("/api/v1/accounts", json={
        "name": "User A Savings",
        "account_type": "savings",
        "balance": "1500.00",
        "currency": "INR",
    }, headers=user_a["headers"])

    client.post("/api/v1/accounts", json={
        "name": "User A Cash Wallet",
        "account_type": "cash",
        "balance": "250.00",
        "currency": "INR",
    }, headers=user_a["headers"])

    # Create 1 account for User B
    client.post("/api/v1/accounts", json={
        "name": "User B Credit Card",
        "account_type": "credit_card",
        "balance": "-5000.00",
        "currency": "INR",
    }, headers=user_b["headers"])

    # User A listing
    res_a = client.get("/api/v1/accounts", headers=user_a["headers"])
    assert res_a.status_code == 200
    accounts_a = res_a.json()
    assert len(accounts_a) == 2
    for acc in accounts_a:
        assert acc["user_id"] == user_a["user"]["id"]
        assert "User A" in acc["name"]

    # User B listing
    res_b = client.get("/api/v1/accounts", headers=user_b["headers"])
    assert res_b.status_code == 200
    accounts_b = res_b.json()
    assert len(accounts_b) == 1
    assert accounts_b[0]["user_id"] == user_b["user"]["id"]
    assert accounts_b[0]["name"] == "User B Credit Card"


def test_get_account_by_id():
    user = register_and_login_user("get_by_id")
    create_res = client.post("/api/v1/accounts", json={
        "name": "Emergency Fund",
        "account_type": "savings",
        "balance": "120000.00",
        "currency": "INR",
    }, headers=user["headers"])
    account_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/accounts/{account_id}", headers=user["headers"])
    assert get_res.status_code == 200
    account_data = get_res.json()
    assert account_data["id"] == account_id
    assert account_data["name"] == "Emergency Fund"
    assert Decimal(account_data["balance"]) == Decimal("120000.00")


def test_update_account():
    user = register_and_login_user("update")
    create_res = client.post("/api/v1/accounts", json={
        "name": "Old Name",
        "account_type": "current",
        "balance": "500.00",
        "currency": "INR",
    }, headers=user["headers"])
    account_id = create_res.json()["id"]

    patch_payload = {
        "name": "New Updated Business Account",
        "balance": "7500.25",
        "account_type": "current",
    }
    update_res = client.patch(
        f"/api/v1/accounts/{account_id}",
        json=patch_payload,
        headers=user["headers"],
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "New Updated Business Account"
    assert Decimal(updated_data["balance"]) == Decimal("7500.25")
    assert updated_data["currency"] == "INR"


def test_delete_account():
    user = register_and_login_user("delete")
    create_res = client.post("/api/v1/accounts", json={
        "name": "Account To Delete",
        "account_type": "other",
        "balance": "0.00",
        "currency": "INR",
    }, headers=user["headers"])
    account_id = create_res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/v1/accounts/{account_id}", headers=user["headers"])
    assert del_res.status_code == 200
    assert "deleted" in del_res.json()["message"].lower()

    # Verify 404 after deletion
    get_res = client.get(f"/api/v1/accounts/{account_id}", headers=user["headers"])
    assert get_res.status_code == 404


def test_invalid_account_type_rejected():
    user = register_and_login_user("invalid_type")
    payload = {
        "name": "Crypto Wallet",
        "account_type": "invalid_type_enum",
        "balance": "100.00",
        "currency": "INR",
    }
    response = client.post("/api/v1/accounts", json=payload, headers=user["headers"])
    assert response.status_code == 422


def test_empty_name_and_invalid_currency_rejected():
    user = register_and_login_user("validation")

    # Empty name
    res_empty_name = client.post("/api/v1/accounts", json={
        "name": "   ",
        "account_type": "savings",
        "balance": "100.00",
        "currency": "INR",
    }, headers=user["headers"])
    assert res_empty_name.status_code == 422

    # Invalid currency length
    res_invalid_curr = client.post("/api/v1/accounts", json={
        "name": "Valid Name",
        "account_type": "savings",
        "balance": "100.00",
        "currency": "RUPEES",
    }, headers=user["headers"])
    assert res_invalid_curr.status_code == 422


def test_cross_user_isolation_prevented():
    user_a = register_and_login_user("isolation_a")
    user_b = register_and_login_user("isolation_b")

    # User A creates an account
    create_res = client.post("/api/v1/accounts", json={
        "name": "User A Secret Vault",
        "account_type": "investment",
        "balance": "999999.99",
        "currency": "INR",
    }, headers=user_a["headers"])
    account_a_id = create_res.json()["id"]

    # User B attempts to GET User A's account -> 404 Not Found
    get_res = client.get(f"/api/v1/accounts/{account_a_id}", headers=user_b["headers"])
    assert get_res.status_code == 404

    # User B attempts to PATCH User A's account -> 404 Not Found
    patch_res = client.patch(
        f"/api/v1/accounts/{account_a_id}",
        json={"name": "Compromised Name"},
        headers=user_b["headers"],
    )
    assert patch_res.status_code == 404

    # User B attempts to DELETE User A's account -> 404 Not Found
    del_res = client.delete(f"/api/v1/accounts/{account_a_id}", headers=user_b["headers"])
    assert del_res.status_code == 404

    # Ensure User A's account remains unmodified and intact
    verify_res = client.get(f"/api/v1/accounts/{account_a_id}", headers=user_a["headers"])
    assert verify_res.status_code == 200
    assert verify_res.json()["name"] == "User A Secret Vault"
