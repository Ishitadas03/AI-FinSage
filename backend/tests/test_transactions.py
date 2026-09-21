from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper fixture to register and log in a unique user, returning user data and auth header."""
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


def create_test_account(user: dict, name: str = "Test Account", balance: str = "10000.00") -> dict:
    """Helper to create an account for the given user."""
    res = client.post(
        "/api/v1/accounts",
        json={
            "name": name,
            "account_type": "savings",
            "balance": balance,
            "currency": "INR",
        },
        headers=user["headers"],
    )
    assert res.status_code == 201
    return res.json()


def test_authenticated_transaction_creation():
    user = register_and_login_user("tx_create")
    account = create_test_account(user, "Salary Account")

    payload = {
        "account_id": account["id"],
        "amount": "2500.50",
        "transaction_type": "expense",
        "category": "food",
        "merchant": "Swiggy",
        "description": "Dinner with team",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/api/v1/transactions", json=payload, headers=user["headers"])
    assert response.status_code == 201
    data = response.json()
    assert data["account_id"] == account["id"]
    assert data["user_id"] == user["user"]["id"]
    assert Decimal(data["amount"]) == Decimal("2500.50")
    assert data["transaction_type"] == "expense"
    assert data["category"] == "food"
    assert data["merchant"] == "Swiggy"
    assert data["description"] == "Dinner with team"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_unauthenticated_transaction_creation_rejected():
    payload = {
        "account_id": str(uuid.uuid4()),
        "amount": "100.00",
        "transaction_type": "expense",
        "category": "other",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/api/v1/transactions", json=payload)
    assert response.status_code == 401


def test_transaction_belongs_to_correct_user():
    user = register_and_login_user("tx_owner")
    account = create_test_account(user, "Wallet")

    payload = {
        "account_id": account["id"],
        "amount": "500.00",
        "transaction_type": "income",
        "category": "salary",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/api/v1/transactions", json=payload, headers=user["headers"])
    assert response.status_code == 201
    assert response.json()["user_id"] == user["user"]["id"]


def test_cross_user_account_access_rejected():
    user_a = register_and_login_user("owner_a")
    user_b = register_and_login_user("owner_b")

    account_b = create_test_account(user_b, "User B Savings")

    # User A tries to create a transaction using User B's account
    payload = {
        "account_id": account_b["id"],
        "amount": "1500.00",
        "transaction_type": "expense",
        "category": "shopping",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/api/v1/transactions", json=payload, headers=user_a["headers"])
    assert response.status_code == 400
    assert "account does not exist or does not belong" in response.json()["detail"].lower()


def test_list_transactions_and_user_isolation():
    user_a = register_and_login_user("list_a")
    user_b = register_and_login_user("list_b")

    account_a = create_test_account(user_a, "Account A")
    account_b = create_test_account(user_b, "Account B")

    # User A creates 2 transactions
    client.post("/api/v1/transactions", json={
        "account_id": account_a["id"],
        "amount": "100.00",
        "transaction_type": "expense",
        "category": "food",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user_a["headers"])

    client.post("/api/v1/transactions", json={
        "account_id": account_a["id"],
        "amount": "200.00",
        "transaction_type": "expense",
        "category": "shopping",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user_a["headers"])

    # User B creates 1 transaction
    client.post("/api/v1/transactions", json={
        "account_id": account_b["id"],
        "amount": "999.00",
        "transaction_type": "income",
        "category": "salary",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user_b["headers"])

    # List User A's transactions
    res_a = client.get("/api/v1/transactions", headers=user_a["headers"])
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["total"] == 2
    assert len(data_a["items"]) == 2
    for item in data_a["items"]:
        assert item["user_id"] == user_a["user"]["id"]

    # List User B's transactions
    res_b = client.get("/api/v1/transactions", headers=user_b["headers"])
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["total"] == 1
    assert data_b["items"][0]["user_id"] == user_b["user"]["id"]
    assert Decimal(data_b["items"][0]["amount"]) == Decimal("999.00")


def test_transactions_pagination():
    user = register_and_login_user("pagination")
    account = create_test_account(user, "Checking")

    # Create 5 transactions
    for i in range(5):
        client.post("/api/v1/transactions", json={
            "account_id": account["id"],
            "amount": f"{(i + 1) * 10}.00",
            "transaction_type": "expense",
            "category": "food",
            "transaction_date": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat(),
        }, headers=user["headers"])

    # Fetch page 1 with page_size=2
    res_p1 = client.get("/api/v1/transactions?page=1&page_size=2", headers=user["headers"])
    assert res_p1.status_code == 200
    p1 = res_p1.json()
    assert p1["total"] == 5
    assert p1["page"] == 1
    assert p1["page_size"] == 2
    assert p1["total_pages"] == 3
    assert len(p1["items"]) == 2

    # Fetch page 3 with page_size=2 (should have 1 item)
    res_p3 = client.get("/api/v1/transactions?page=3&page_size=2", headers=user["headers"])
    assert res_p3.status_code == 200
    p3 = res_p3.json()
    assert len(p3["items"]) == 1


def test_transactions_filters():
    user = register_and_login_user("filters")
    account1 = create_test_account(user, "Bank 1")
    account2 = create_test_account(user, "Bank 2")

    now = datetime.now(timezone.utc)

    # 1. Salary in Bank 1 (Income, 50000.00, 5 days ago)
    client.post("/api/v1/transactions", json={
        "account_id": account1["id"],
        "amount": "50000.00",
        "transaction_type": "income",
        "category": "salary",
        "merchant": "Acme Corp",
        "transaction_date": (now - timedelta(days=5)).isoformat(),
    }, headers=user["headers"])

    # 2. Food in Bank 1 (Expense, 450.00, 3 days ago)
    client.post("/api/v1/transactions", json={
        "account_id": account1["id"],
        "amount": "450.00",
        "transaction_type": "expense",
        "category": "food",
        "merchant": "Starbucks",
        "transaction_date": (now - timedelta(days=3)).isoformat(),
    }, headers=user["headers"])

    # 3. Rent in Bank 2 (Expense, 15000.00, 1 day ago)
    client.post("/api/v1/transactions", json={
        "account_id": account2["id"],
        "amount": "15000.00",
        "transaction_type": "expense",
        "category": "rent",
        "merchant": "Landlord",
        "transaction_date": (now - timedelta(days=1)).isoformat(),
    }, headers=user["headers"])

    # Filter by account_id
    res_acc = client.get(f"/api/v1/transactions?account_id={account2['id']}", headers=user["headers"])
    assert res_acc.status_code == 200
    assert res_acc.json()["total"] == 1
    assert res_acc.json()["items"][0]["category"] == "rent"

    # Filter by transaction_type
    res_type = client.get("/api/v1/transactions?transaction_type=income", headers=user["headers"])
    assert res_type.status_code == 200
    assert res_type.json()["total"] == 1
    assert res_type.json()["items"][0]["category"] == "salary"

    # Filter by category
    res_cat = client.get("/api/v1/transactions?category=food", headers=user["headers"])
    assert res_cat.status_code == 200
    assert res_cat.json()["total"] == 1
    assert res_cat.json()["items"][0]["merchant"] == "Starbucks"

    # Filter by merchant substring
    res_merch = client.get("/api/v1/transactions?merchant=star", headers=user["headers"])
    assert res_merch.status_code == 200
    assert res_merch.json()["total"] == 1

    # Filter by amount range
    res_amt = client.get("/api/v1/transactions?min_amount=1000.00&max_amount=20000.00", headers=user["headers"])
    assert res_amt.status_code == 200
    assert res_amt.json()["total"] == 1
    assert res_amt.json()["items"][0]["category"] == "rent"

    # Filter by date range
    start = (now - timedelta(days=4)).isoformat()
    end = (now - timedelta(days=2)).isoformat()
    res_date = client.get(
        "/api/v1/transactions",
        params={"start_date": start, "end_date": end},
        headers=user["headers"],
    )
    assert res_date.status_code == 200
    assert res_date.json()["total"] == 1
    assert res_date.json()["items"][0]["category"] == "food"



def test_get_transaction_by_id():
    user = register_and_login_user("get_by_id")
    account = create_test_account(user, "Savings")

    create_res = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "1200.00",
        "transaction_type": "expense",
        "category": "bills",
        "merchant": "Electricity Board",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user["headers"])
    tx_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/transactions/{tx_id}", headers=user["headers"])
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == tx_id
    assert Decimal(data["amount"]) == Decimal("1200.00")
    assert data["category"] == "bills"


def test_update_transaction():
    user = register_and_login_user("update_tx")
    account1 = create_test_account(user, "Acc 1")
    account2 = create_test_account(user, "Acc 2")

    create_res = client.post("/api/v1/transactions", json={
        "account_id": account1["id"],
        "amount": "300.00",
        "transaction_type": "expense",
        "category": "food",
        "merchant": "Cafe",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user["headers"])
    tx_id = create_res.json()["id"]

    # Update amount, category, merchant, and switch account to account2
    patch_payload = {
        "amount": "450.75",
        "category": "entertainment",
        "merchant": "Cinema Cafe",
        "account_id": account2["id"],
    }
    update_res = client.patch(
        f"/api/v1/transactions/{tx_id}",
        json=patch_payload,
        headers=user["headers"],
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert Decimal(data["amount"]) == Decimal("450.75")
    assert data["category"] == "entertainment"
    assert data["merchant"] == "Cinema Cafe"
    assert data["account_id"] == account2["id"]


def test_update_transaction_to_another_users_account_rejected():
    user_a = register_and_login_user("upd_user_a")
    user_b = register_and_login_user("upd_user_b")

    acc_a = create_test_account(user_a, "User A Acc")
    acc_b = create_test_account(user_b, "User B Acc")

    create_res = client.post("/api/v1/transactions", json={
        "account_id": acc_a["id"],
        "amount": "100.00",
        "transaction_type": "expense",
        "category": "food",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user_a["headers"])
    tx_id = create_res.json()["id"]

    # User A tries to change transaction's account_id to User B's account
    patch_res = client.patch(
        f"/api/v1/transactions/{tx_id}",
        json={"account_id": acc_b["id"]},
        headers=user_a["headers"],
    )
    assert patch_res.status_code == 400
    assert "target account does not exist or does not belong" in patch_res.json()["detail"].lower()


def test_delete_transaction():
    user = register_and_login_user("delete_tx")
    account = create_test_account(user, "Savings")

    create_res = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "700.00",
        "transaction_type": "expense",
        "category": "shopping",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user["headers"])
    tx_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/transactions/{tx_id}", headers=user["headers"])
    assert del_res.status_code == 200
    assert "deleted" in del_res.json()["message"].lower()

    # Verify 404 after deletion
    get_res = client.get(f"/api/v1/transactions/{tx_id}", headers=user["headers"])
    assert get_res.status_code == 404


def test_validation_errors():
    user = register_and_login_user("validation")
    account = create_test_account(user, "Savings")

    now_str = datetime.now(timezone.utc).isoformat()

    # 1. Invalid transaction type
    res1 = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "100.00",
        "transaction_type": "gambling",
        "category": "food",
        "transaction_date": now_str,
    }, headers=user["headers"])
    assert res1.status_code == 422

    # 2. Invalid category
    res2 = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "100.00",
        "transaction_type": "expense",
        "category": "nonexistent_category",
        "transaction_date": now_str,
    }, headers=user["headers"])
    assert res2.status_code == 422

    # 3. Invalid amount (zero or negative)
    res3 = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "0.00",
        "transaction_type": "expense",
        "category": "food",
        "transaction_date": now_str,
    }, headers=user["headers"])
    assert res3.status_code == 422

    res4 = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "-50.00",
        "transaction_type": "expense",
        "category": "food",
        "transaction_date": now_str,
    }, headers=user["headers"])
    assert res4.status_code == 422


def test_cross_user_transaction_isolation():
    user_a = register_and_login_user("cross_a")
    user_b = register_and_login_user("cross_b")

    acc_a = create_test_account(user_a, "User A Acc")

    create_res = client.post("/api/v1/transactions", json={
        "account_id": acc_a["id"],
        "amount": "888.00",
        "transaction_type": "expense",
        "category": "healthcare",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user_a["headers"])
    tx_a_id = create_res.json()["id"]

    # User B tries to GET User A's transaction -> 404
    get_res = client.get(f"/api/v1/transactions/{tx_a_id}", headers=user_b["headers"])
    assert get_res.status_code == 404

    # User B tries to PATCH User A's transaction -> 404
    patch_res = client.patch(
        f"/api/v1/transactions/{tx_a_id}",
        json={"amount": "1.00"},
        headers=user_b["headers"],
    )
    assert patch_res.status_code == 404

    # User B tries to DELETE User A's transaction -> 404
    del_res = client.delete(f"/api/v1/transactions/{tx_a_id}", headers=user_b["headers"])
    assert del_res.status_code == 404

    # Verify transaction remains untouched
    verify_res = client.get(f"/api/v1/transactions/{tx_a_id}", headers=user_a["headers"])
    assert verify_res.status_code == 200
    assert Decimal(verify_res.json()["amount"]) == Decimal("888.00")
