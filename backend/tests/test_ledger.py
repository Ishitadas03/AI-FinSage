from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.transaction_service import TransactionService

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


def create_account(user: dict, name: str, account_type: str = "savings", balance: str = "1000.00") -> dict:
    res = client.post(
        "/api/v1/accounts",
        json={
            "name": name,
            "account_type": account_type,
            "balance": balance,
            "currency": "INR",
        },
        headers=user["headers"],
    )
    assert res.status_code == 201
    return res.json()


def test_income_increases_asset_balance():
    user = register_and_login_user("income_test")
    # Opening balance = 5000.00
    account = create_account(user, "Savings", "savings", "5000.00")
    assert Decimal(account["balance"]) == Decimal("5000.00")
    assert Decimal(account["current_balance"]) == Decimal("5000.00")

    # Add income of 2500.00
    tx_res = client.post(
        "/api/v1/transactions",
        json={
            "account_id": account["id"],
            "amount": "2500.00",
            "transaction_type": "income",
            "category": "salary",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
        },
        headers=user["headers"],
    )
    assert tx_res.status_code == 201

    # Check updated account balance
    acc_res = client.get(f"/api/v1/accounts/{account['id']}", headers=user["headers"])
    assert acc_res.status_code == 200
    data = acc_res.json()
    assert Decimal(data["balance"]) == Decimal("5000.00")  # Opening balance unchanged
    assert Decimal(data["current_balance"]) == Decimal("7500.00")  # 5000 + 2500


def test_expense_decreases_asset_balance():
    user = register_and_login_user("expense_test")
    # Opening balance = 10000.00
    account = create_account(user, "Checking", "current", "10000.00")

    # Add expense of 1500.25
    tx_res = client.post(
        "/api/v1/transactions",
        json={
            "account_id": account["id"],
            "amount": "1500.25",
            "transaction_type": "expense",
            "category": "food",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
        },
        headers=user["headers"],
    )
    assert tx_res.status_code == 201

    # Check balance: 10000 - 1500.25 = 8499.75
    acc_res = client.get(f"/api/v1/accounts/{account['id']}", headers=user["headers"])
    assert acc_res.status_code == 200
    data = acc_res.json()
    assert Decimal(data["balance"]) == Decimal("10000.00")
    assert Decimal(data["current_balance"]) == Decimal("8499.75")


def test_transfer_source_and_destination_balances():
    user = register_and_login_user("transfer_test")
    source_acc = create_account(user, "Source Bank", "savings", "20000.00")
    dest_acc = create_account(user, "Destination Wallet", "cash", "500.00")

    # Transfer 3000.00 from source to dest
    tx_res = client.post(
        "/api/v1/transactions",
        json={
            "account_id": source_acc["id"],
            "destination_account_id": dest_acc["id"],
            "amount": "3000.00",
            "transaction_type": "transfer",
            "category": "cash",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
        },
        headers=user["headers"],
    )
    assert tx_res.status_code == 201

    # Verify source: 20000 - 3000 = 17000
    src_res = client.get(f"/api/v1/accounts/{source_acc['id']}", headers=user["headers"])
    assert Decimal(src_res.json()["current_balance"]) == Decimal("17000.00")

    # Verify dest: 500 + 3000 = 3500
    dest_res = client.get(f"/api/v1/accounts/{dest_acc['id']}", headers=user["headers"])
    assert Decimal(dest_res.json()["current_balance"]) == Decimal("3500.00")


def test_transfer_validation_rules():
    user = register_and_login_user("transfer_val")
    user_other = register_and_login_user("transfer_other")

    acc_a = create_account(user, "Acc A", "savings", "1000.00")
    acc_other = create_account(user_other, "Acc Other User", "savings", "1000.00")

    now = datetime.now(timezone.utc).isoformat()

    # 1. Transfer without destination_account_id -> 422 validation error
    res_no_dest = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a["id"],
            "amount": "100.00",
            "transaction_type": "transfer",
            "category": "other",
            "transaction_date": now,
        },
        headers=user["headers"],
    )
    assert res_no_dest.status_code == 422

    # 2. Transfer to same account -> 422 validation error
    res_same_dest = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a["id"],
            "destination_account_id": acc_a["id"],
            "amount": "100.00",
            "transaction_type": "transfer",
            "category": "other",
            "transaction_date": now,
        },
        headers=user["headers"],
    )
    assert res_same_dest.status_code == 422

    # 3. Transfer to another user's account -> 400 Bad Request
    res_cross_user = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a["id"],
            "destination_account_id": acc_other["id"],
            "amount": "100.00",
            "transaction_type": "transfer",
            "category": "other",
            "transaction_date": now,
        },
        headers=user["headers"],
    )
    assert res_cross_user.status_code == 400
    assert "destination account does not exist or does not belong" in res_cross_user.json()["detail"].lower()

    # 4. Income with destination_account_id provided -> 422 validation error
    res_invalid_income = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a["id"],
            "destination_account_id": str(uuid.uuid4()),
            "amount": "100.00",
            "transaction_type": "income",
            "category": "salary",
            "transaction_date": now,
        },
        headers=user["headers"],
    )
    assert res_invalid_income.status_code == 422


def test_transfer_excluded_from_global_cashflow():
    user = register_and_login_user("cashflow_test")
    acc1 = create_account(user, "Bank 1", "savings", "5000.00")
    acc2 = create_account(user, "Bank 2", "current", "2000.00")

    now = datetime.now(timezone.utc).isoformat()

    # 1. Income: 10000
    client.post("/api/v1/transactions", json={
        "account_id": acc1["id"],
        "amount": "10000.00",
        "transaction_type": "income",
        "category": "salary",
        "transaction_date": now,
    }, headers=user["headers"])

    # 2. Expense: 3000
    client.post("/api/v1/transactions", json={
        "account_id": acc1["id"],
        "amount": "3000.00",
        "transaction_type": "expense",
        "category": "rent",
        "transaction_date": now,
    }, headers=user["headers"])

    # 3. Transfer: 4000 from Bank 1 to Bank 2
    client.post("/api/v1/transactions", json={
        "account_id": acc1["id"],
        "destination_account_id": acc2["id"],
        "amount": "4000.00",
        "transaction_type": "transfer",
        "category": "other",
        "transaction_date": now,
    }, headers=user["headers"])

    # Check cashflow calculation in service
    db = SessionLocal()
    try:
        cashflow = TransactionService.calculate_user_cashflow(db, uuid.UUID(user["user"]["id"]))
        assert cashflow["total_income"] == Decimal("10000.00")
        assert cashflow["total_expense"] == Decimal("3000.00")
        assert cashflow["net_savings"] == Decimal("7000.00")
    finally:
        db.close()


def test_transaction_update_and_delete_recalculates_balance():
    user = register_and_login_user("upd_del_recalc")
    account = create_account(user, "Savings", "savings", "1000.00")

    # Create expense of 200.00 -> balance becomes 800.00
    tx_res = client.post("/api/v1/transactions", json={
        "account_id": account["id"],
        "amount": "200.00",
        "transaction_type": "expense",
        "category": "food",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
    }, headers=user["headers"])
    tx_id = tx_res.json()["id"]

    acc1 = client.get(f"/api/v1/accounts/{account['id']}", headers=user["headers"]).json()
    assert Decimal(acc1["current_balance"]) == Decimal("800.00")

    # Update expense to 500.00 -> balance becomes 1000 - 500 = 500.00
    client.patch(f"/api/v1/transactions/{tx_id}", json={"amount": "500.00"}, headers=user["headers"])
    acc2 = client.get(f"/api/v1/accounts/{account['id']}", headers=user["headers"]).json()
    assert Decimal(acc2["current_balance"]) == Decimal("500.00")

    # Delete transaction -> balance reverts to 1000.00
    client.delete(f"/api/v1/transactions/{tx_id}", headers=user["headers"])
    acc3 = client.get(f"/api/v1/accounts/{account['id']}", headers=user["headers"]).json()
    assert Decimal(acc3["current_balance"]) == Decimal("1000.00")


def test_credit_card_expense_and_payment_behavior():
    user = register_and_login_user("cc_test")
    # Credit Card starts with 0.00 outstanding debt
    card = create_account(user, "ICICI Amazon Pay Card", "credit_card", "0.00")
    bank = create_account(user, "HDFC Salary Account", "savings", "50000.00")

    assert Decimal(card["current_balance"]) == Decimal("0.00")

    now = datetime.now(timezone.utc).isoformat()

    # 1. Purchase on credit card (expense of 4500.00)
    client.post("/api/v1/transactions", json={
        "account_id": card["id"],
        "amount": "4500.00",
        "transaction_type": "expense",
        "category": "shopping",
        "merchant": "Amazon",
        "transaction_date": now,
    }, headers=user["headers"])

    # Credit card current_balance (outstanding debt) increases to 4500.00
    card_res = client.get(f"/api/v1/accounts/{card['id']}", headers=user["headers"]).json()
    assert Decimal(card_res["current_balance"]) == Decimal("4500.00")

    # 2. Pay Credit Card bill via transfer from HDFC Bank
    client.post("/api/v1/transactions", json={
        "account_id": bank["id"],
        "destination_account_id": card["id"],
        "amount": "4500.00",
        "transaction_type": "transfer",
        "category": "bills",
        "description": "Credit card bill payment",
        "transaction_date": now,
    }, headers=user["headers"])

    # Bank balance reduced: 50000 - 4500 = 45500
    bank_res = client.get(f"/api/v1/accounts/{bank['id']}", headers=user["headers"]).json()
    assert Decimal(bank_res["current_balance"]) == Decimal("45500.00")

    # Credit card balance (debt) reduced back to 0.00
    card_res2 = client.get(f"/api/v1/accounts/{card['id']}", headers=user["headers"]).json()
    assert Decimal(card_res2["current_balance"]) == Decimal("0.00")
