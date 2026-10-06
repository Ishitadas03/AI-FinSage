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


def create_account(user: dict, name: str = "Primary Account", account_type: str = "savings", balance: str = "50000.00") -> dict:
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


def create_tx(
    user: dict,
    account_id: str,
    amount: str,
    tx_type: str,
    category: str,
    tx_date: datetime,
    merchant: str = None,
    dest_account_id: str = None,
) -> dict:
    payload = {
        "account_id": account_id,
        "amount": amount,
        "transaction_type": tx_type,
        "category": category,
        "transaction_date": tx_date.isoformat(),
        "merchant": merchant,
    }
    if dest_account_id:
        payload["destination_account_id"] = dest_account_id
    res = client.post("/api/v1/transactions", json=payload, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def test_empty_transaction_history():
    user = register_and_login_user("empty")
    create_account(user, "Empty Account")

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert Decimal(data["summary"]["total_income"]) == Decimal("0.00")
    assert Decimal(data["summary"]["total_expenses"]) == Decimal("0.00")
    assert Decimal(data["summary"]["net_cash_flow"]) == Decimal("0.00")
    assert Decimal(data["summary"]["savings_rate"]) == Decimal("0.00")
    assert len(data["spending_by_category"]) == 0
    assert len(data["income_by_category"]) == 0
    assert len(data["account_breakdown"]) == 1
    assert Decimal(data["account_breakdown"][0]["income"]) == Decimal("0.00")
    assert Decimal(data["account_breakdown"][0]["expenses"]) == Decimal("0.00")
    assert len(data["trend"]) == 0
    assert len(data["top_expenses"]) == 0


def test_core_metrics_and_savings_rate():
    user = register_and_login_user("metrics")
    acc = create_account(user, "Salary Account")

    now = datetime.now(timezone.utc)

    # Income: 100,000.00
    create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=2))

    # Expenses: 35,000.00
    create_tx(user, acc["id"], "20000.00", "expense", "rent", now - timedelta(days=5))
    create_tx(user, acc["id"], "15000.00", "expense", "food", now - timedelta(days=3))

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    summary = res.json()["summary"]

    # total_income = 100000.00
    assert Decimal(summary["total_income"]) == Decimal("100000.00")
    # total_expenses = 35000.00
    assert Decimal(summary["total_expenses"]) == Decimal("35000.00")
    # net_cash_flow = 65000.00
    assert Decimal(summary["net_cash_flow"]) == Decimal("65000.00")
    # savings_rate = (65000 / 100000) * 100 = 65.00%
    assert Decimal(summary["savings_rate"]) == Decimal("65.00")


def test_zero_income_and_negative_cash_flow():
    user = register_and_login_user("zero_inc")
    acc = create_account(user, "Spending Account")

    now = datetime.now(timezone.utc)
    create_tx(user, acc["id"], "5000.00", "expense", "shopping", now - timedelta(days=1))

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    summary = res.json()["summary"]

    assert Decimal(summary["total_income"]) == Decimal("0.00")
    assert Decimal(summary["total_expenses"]) == Decimal("5000.00")
    assert Decimal(summary["net_cash_flow"]) == Decimal("-5000.00")
    # Must not raise division by zero
    assert Decimal(summary["savings_rate"]) == Decimal("0.00")


def test_spending_and_income_by_category():
    user = register_and_login_user("categories")
    acc = create_account(user, "Checking")

    now = datetime.now(timezone.utc)

    # Income
    create_tx(user, acc["id"], "80000.00", "income", "salary", now - timedelta(days=5))
    create_tx(user, acc["id"], "20000.00", "income", "investment", now - timedelta(days=2))

    # Expenses
    create_tx(user, acc["id"], "15000.00", "expense", "rent", now - timedelta(days=4))
    create_tx(user, acc["id"], "5000.00", "expense", "food", now - timedelta(days=3))

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    # Spending by category
    spending = data["spending_by_category"]
    assert len(spending) == 2
    # Rent is 15000 / 20000 = 75.00%
    assert spending[0]["category"] == "rent"
    assert Decimal(spending[0]["amount"]) == Decimal("15000.00")
    assert Decimal(spending[0]["percentage"]) == Decimal("75.00")
    # Food is 5000 / 20000 = 25.00%
    assert spending[1]["category"] == "food"
    assert Decimal(spending[1]["amount"]) == Decimal("5000.00")
    assert Decimal(spending[1]["percentage"]) == Decimal("25.00")

    # Income by category
    income = data["income_by_category"]
    assert len(income) == 2
    # Salary is 80000 / 100000 = 80.00%
    assert income[0]["category"] == "salary"
    assert Decimal(income[0]["amount"]) == Decimal("80000.00")
    assert Decimal(income[0]["percentage"]) == Decimal("80.00")
    # Investment is 20000 / 100000 = 20.00%
    assert income[1]["category"] == "investment"
    assert Decimal(income[1]["amount"]) == Decimal("20000.00")
    assert Decimal(income[1]["percentage"]) == Decimal("20.00")


def test_account_breakdown():
    user = register_and_login_user("acc_breakdown")
    acc1 = create_account(user, "HDFC Bank", "savings")
    acc2 = create_account(user, "ICICI Card", "credit_card")

    now = datetime.now(timezone.utc)
    create_tx(user, acc1["id"], "60000.00", "income", "salary", now - timedelta(days=5))
    create_tx(user, acc1["id"], "10000.00", "expense", "bills", now - timedelta(days=4))
    create_tx(user, acc2["id"], "8000.00", "expense", "shopping", now - timedelta(days=2))

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    breakdown = res.json()["account_breakdown"]

    assert len(breakdown) == 2
    hdfc = next(b for b in breakdown if b["account_id"] == acc1["id"])
    assert Decimal(hdfc["income"]) == Decimal("60000.00")
    assert Decimal(hdfc["expenses"]) == Decimal("10000.00")
    assert Decimal(hdfc["net_cash_flow"]) == Decimal("50000.00")

    icici = next(b for b in breakdown if b["account_id"] == acc2["id"])
    assert Decimal(icici["income"]) == Decimal("0.00")
    assert Decimal(icici["expenses"]) == Decimal("8000.00")
    assert Decimal(icici["net_cash_flow"]) == Decimal("-8000.00")


def test_transfers_excluded_from_analytics():
    user = register_and_login_user("transfer_excl")
    acc1 = create_account(user, "Bank A", "savings")
    acc2 = create_account(user, "Bank B", "current")

    now = datetime.now(timezone.utc)

    # Real income & expense
    create_tx(user, acc1["id"], "50000.00", "income", "salary", now - timedelta(days=3))
    create_tx(user, acc1["id"], "10000.00", "expense", "food", now - timedelta(days=2))

    # Transfer of 25,000 between accounts
    create_tx(
        user=user,
        account_id=acc1["id"],
        amount="25000.00",
        tx_type="transfer",
        category="other",
        tx_date=now - timedelta(days=1),
        dest_account_id=acc2["id"],
    )

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    # Transfer MUST NOT appear in total income or total expenses
    assert Decimal(data["summary"]["total_income"]) == Decimal("50000.00")
    assert Decimal(data["summary"]["total_expenses"]) == Decimal("10000.00")
    assert Decimal(data["summary"]["net_cash_flow"]) == Decimal("40000.00")

    # Categories must not contain the transfer
    assert len(data["spending_by_category"]) == 1
    assert data["spending_by_category"][0]["category"] == "food"


def test_top_expenses():
    user = register_and_login_user("top_exp")
    acc = create_account(user, "Main Account")

    now = datetime.now(timezone.utc)

    # Create multiple expenses
    create_tx(user, acc["id"], "1500.00", "expense", "food", now - timedelta(days=5), merchant="Dominos")
    create_tx(user, acc["id"], "45000.00", "expense", "rent", now - timedelta(days=4), merchant="Landlord")
    create_tx(user, acc["id"], "8500.00", "expense", "shopping", now - timedelta(days=3), merchant="Amazon")
    create_tx(user, acc["id"], "3000.00", "expense", "transport", now - timedelta(days=2), merchant="Uber")

    res = client.get("/api/v1/analytics/overview", headers=user["headers"])
    assert res.status_code == 200
    top = res.json()["top_expenses"]

    assert len(top) == 4
    # Highest expense must be first
    assert Decimal(top[0]["amount"]) == Decimal("45000.00")
    assert top[0]["category"] == "rent"
    assert top[0]["merchant"] == "Landlord"
    assert top[0]["account_name"] == "Main Account"

    assert Decimal(top[1]["amount"]) == Decimal("8500.00")
    assert Decimal(top[2]["amount"]) == Decimal("3000.00")
    assert Decimal(top[3]["amount"]) == Decimal("1500.00")


def test_date_and_account_filtering():
    user = register_and_login_user("filtering")
    acc1 = create_account(user, "Account 1")
    acc2 = create_account(user, "Account 2")

    now = datetime.now(timezone.utc)

    # Day -10: Expense in Acc 1 (1000)
    create_tx(user, acc1["id"], "1000.00", "expense", "food", now - timedelta(days=10))
    # Day -5: Expense in Acc 1 (2000)
    create_tx(user, acc1["id"], "2000.00", "expense", "food", now - timedelta(days=5))
    # Day -5: Expense in Acc 2 (5000)
    create_tx(user, acc2["id"], "5000.00", "expense", "shopping", now - timedelta(days=5))

    # Filter by account_id = Acc 1 (explicit start_date to cover month boundaries)
    res_acc = client.get(
        "/api/v1/analytics/overview",
        params={"account_id": acc1["id"], "start_date": (now - timedelta(days=15)).isoformat()},
        headers=user["headers"],
    )
    assert res_acc.status_code == 200
    assert Decimal(res_acc.json()["summary"]["total_expenses"]) == Decimal("3000.00")

    # Filter by date range (days -6 to -4)
    start = (now - timedelta(days=6)).isoformat()
    end = (now - timedelta(days=4)).isoformat()
    res_date = client.get(
        "/api/v1/analytics/overview",
        params={"start_date": start, "end_date": end},
        headers=user["headers"],
    )
    assert res_date.status_code == 200
    # Both Acc 1 (2000) and Acc 2 (5000) fall in this range
    assert Decimal(res_date.json()["summary"]["total_expenses"]) == Decimal("7000.00")


def test_cross_user_isolation_and_invalid_account():
    user_a = register_and_login_user("user_a")
    user_b = register_and_login_user("user_b")

    acc_a = create_account(user_a, "User A Acc")
    acc_b = create_account(user_b, "User B Acc")

    now = datetime.now(timezone.utc)
    create_tx(user_a, acc_a["id"], "10000.00", "income", "salary", now - timedelta(days=1))
    create_tx(user_b, acc_b["id"], "99000.00", "income", "salary", now - timedelta(days=1))

    # User A analytics should NOT see User B's 99000
    res_a = client.get("/api/v1/analytics/overview", headers=user_a["headers"])
    assert res_a.status_code == 200
    assert Decimal(res_a.json()["summary"]["total_income"]) == Decimal("10000.00")

    # User A cannot request analytics using User B's account_id -> 400 Bad Request
    res_cross = client.get(
        "/api/v1/analytics/overview",
        params={"account_id": acc_b["id"]},
        headers=user_a["headers"],
    )
    assert res_cross.status_code == 400
    assert "account does not exist or does not belong" in res_cross.json()["detail"].lower()
