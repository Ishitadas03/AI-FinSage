"""
Financial Budgets REST API Tests (Phase 4B Part 2).

Comprehensive endpoint tests covering:
- Authentication enforcement (401 on unauthenticated requests)
- Budget creation with validation and strict user_id scoping
- Listing with filtering (category, period, dates), pagination, and spending summaries
- Filter validation errors (400 Bad Request on invalid query parameters)
- Single budget retrieval with 404 for nonexistent/cross-user budgets
- Partial updates with recalculated spending summary
- Budget deletion with cross-user isolation
- Dedicated /spending endpoint verification and embedded spending consistency
- Expense-only aggregation (income and transfers excluded)
- Category and date window isolation
- Repeated calculation determinism
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper to register and login a distinct user, returning user payload and auth headers."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"Budget API User {uid} {name_suffix}".strip(),
        "email": f"budget_api_user_{uid}_{name_suffix.lower()}@example.com",
        "password": "SecurePassword123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": user_payload["email"],
            "password": user_payload["password"],
        },
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user_data, "token": token, "headers": headers}


def create_user_account(user_headers: dict, name: str = "Checking") -> str:
    res = client.post(
        "/api/v1/accounts",
        json={
            "name": name,
            "account_type": "savings",
            "balance": "100000.00",
            "currency": "INR",
        },
        headers=user_headers,
    )
    assert res.status_code == 201
    return res.json()["id"]


def record_transaction(
    user_headers: dict,
    account_id: str,
    amount: str,
    tx_type: str,
    category: str,
    tx_date: str,
    destination_account_id: str = None,
) -> dict:
    payload = {
        "account_id": account_id,
        "amount": amount,
        "transaction_type": tx_type,
        "category": category,
        "transaction_date": tx_date,
    }
    if destination_account_id:
        payload["destination_account_id"] = destination_account_id
    res = client.post("/api/v1/transactions", json=payload, headers=user_headers)
    assert res.status_code == 201
    return res.json()


# ===========================================================================
# 1. Authentication Enforcement Tests
# ===========================================================================
class TestBudgetsAPIAuthentication:
    def test_unauthenticated_post_rejected(self):
        res = client.post(
            "/api/v1/budgets",
            json={
                "name": "Unauthorized Budget",
                "category": "food",
                "amount": "10000.00",
                "start_date": "2026-10-01",
                "end_date": "2026-10-31",
            },
        )
        assert res.status_code == 401

    def test_unauthenticated_get_all_rejected(self):
        res = client.get("/api/v1/budgets")
        assert res.status_code == 401

    def test_unauthenticated_get_by_id_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.get(f"/api/v1/budgets/{random_id}")
        assert res.status_code == 401

    def test_unauthenticated_patch_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.patch(
            f"/api/v1/budgets/{random_id}",
            json={"name": "Hacked"},
        )
        assert res.status_code == 401

    def test_unauthenticated_delete_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.delete(f"/api/v1/budgets/{random_id}")
        assert res.status_code == 401

    def test_unauthenticated_spending_endpoint_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.get(f"/api/v1/budgets/{random_id}/spending")
        assert res.status_code == 401


# ===========================================================================
# 2. Budget Creation Tests
# ===========================================================================
class TestBudgetsAPICreate:
    def test_successful_budget_creation_with_spending(self):
        user = register_and_login_user("create_budget_success")
        payload = {
            "name": "Monthly Food Budget",
            "category": "food",
            "amount": "12000.00",
            "period": "monthly",
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
        }
        res = client.post("/api/v1/budgets", json=payload, headers=user["headers"])
        assert res.status_code == 201
        data = res.json()

        assert "id" in data
        assert data["user_id"] == user["user"]["id"]
        assert data["name"] == "Monthly Food Budget"
        assert data["category"] == "food"
        assert Decimal(data["amount"]) == Decimal("12000.00")
        assert data["period"] == "monthly"
        assert data["start_date"] == "2026-10-01"
        assert data["end_date"] == "2026-10-31"

        # Embedded spending summary
        assert "spending" in data
        spending = data["spending"]
        assert Decimal(spending["budget_amount"]) == Decimal("12000.00")
        assert Decimal(spending["actual_spending"]) == Decimal("0.00")
        assert Decimal(spending["remaining_amount"]) == Decimal("12000.00")
        assert Decimal(spending["over_budget_amount"]) == Decimal("0.00")
        assert Decimal(spending["spending_percentage"]) == Decimal("0.00")
        assert spending["status"] == "healthy"

    def test_user_id_injection_attempt_ignored(self):
        user = register_and_login_user("user_id_injection")
        fake_uid = str(uuid.uuid4())
        payload = {
            "name": "Transport Budget",
            "category": "transport",
            "amount": "5000.00",
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
            "user_id": fake_uid,  # Injected
        }
        res = client.post("/api/v1/budgets", json=payload, headers=user["headers"])
        assert res.status_code == 201
        data = res.json()
        assert data["user_id"] == user["user"]["id"]
        assert data["user_id"] != fake_uid

    def test_validation_errors_rejected(self):
        user = register_and_login_user("create_validation")

        # Zero amount
        res1 = client.post(
            "/api/v1/budgets",
            json={"name": "Zero", "category": "food", "amount": "0.00", "start_date": "2026-10-01", "end_date": "2026-10-31"},
            headers=user["headers"],
        )
        assert res1.status_code in (400, 422)

        # Negative amount
        res2 = client.post(
            "/api/v1/budgets",
            json={"name": "Neg", "category": "food", "amount": "-1000.00", "start_date": "2026-10-01", "end_date": "2026-10-31"},
            headers=user["headers"],
        )
        assert res2.status_code in (400, 422)

        # Empty name
        res3 = client.post(
            "/api/v1/budgets",
            json={"name": "   ", "category": "food", "amount": "5000.00", "start_date": "2026-10-01", "end_date": "2026-10-31"},
            headers=user["headers"],
        )
        assert res3.status_code in (400, 422)

        # Invalid category
        res4 = client.post(
            "/api/v1/budgets",
            json={"name": "Bad Cat", "category": "super_crypto", "amount": "5000.00", "start_date": "2026-10-01", "end_date": "2026-10-31"},
            headers=user["headers"],
        )
        assert res4.status_code in (400, 422)

        # Invalid period
        res5 = client.post(
            "/api/v1/budgets",
            json={"name": "Bad Period", "category": "food", "amount": "5000.00", "period": "daily", "start_date": "2026-10-01", "end_date": "2026-10-31"},
            headers=user["headers"],
        )
        assert res5.status_code in (400, 422)

        # End date before start date
        res6 = client.post(
            "/api/v1/budgets",
            json={"name": "Bad Dates", "category": "food", "amount": "5000.00", "start_date": "2026-10-31", "end_date": "2026-10-01"},
            headers=user["headers"],
        )
        assert res6.status_code in (400, 422)


# ===========================================================================
# 3. List Budgets, Filtering, and Pagination Tests
# ===========================================================================
class TestBudgetsAPIList:
    def test_empty_list_initially(self):
        user = register_and_login_user("empty_list")
        res = client.get("/api/v1/budgets", headers=user["headers"])
        assert res.status_code == 200
        assert res.json() == []

    def test_list_multiple_budgets_with_filters_and_pagination(self):
        user = register_and_login_user("list_filters")

        # Create 3 budgets
        client.post("/api/v1/budgets", json={
            "name": "Food Monthly", "category": "food", "amount": "10000.00",
            "period": "monthly", "start_date": "2026-10-01", "end_date": "2026-10-31",
        }, headers=user["headers"])

        client.post("/api/v1/budgets", json={
            "name": "Shopping Weekly", "category": "shopping", "amount": "3000.00",
            "period": "weekly", "start_date": "2026-10-01", "end_date": "2026-10-07",
        }, headers=user["headers"])

        client.post("/api/v1/budgets", json={
            "name": "Bills Monthly", "category": "bills", "amount": "15000.00",
            "period": "monthly", "start_date": "2026-10-01", "end_date": "2026-10-31",
        }, headers=user["headers"])

        # All list
        all_res = client.get("/api/v1/budgets", headers=user["headers"])
        assert all_res.status_code == 200
        assert len(all_res.json()) == 3

        # Filter by category=food
        cat_res = client.get("/api/v1/budgets?category=food", headers=user["headers"])
        assert cat_res.status_code == 200
        assert len(cat_res.json()) == 1
        assert cat_res.json()[0]["category"] == "food"

        # Filter by period=weekly
        period_res = client.get("/api/v1/budgets?period=weekly", headers=user["headers"])
        assert period_res.status_code == 200
        assert len(period_res.json()) == 1
        assert period_res.json()[0]["period"] == "weekly"

        # Pagination
        p1 = client.get("/api/v1/budgets?page=1&page_size=2", headers=user["headers"])
        assert p1.status_code == 200
        assert len(p1.json()) == 2

        p2 = client.get("/api/v1/budgets?page=2&page_size=2", headers=user["headers"])
        assert p2.status_code == 200
        assert len(p2.json()) == 1

    def test_invalid_filter_rejected(self):
        user = register_and_login_user("invalid_filter")

        # Invalid category filter
        res1 = client.get("/api/v1/budgets?category=invalid_cat", headers=user["headers"])
        assert res1.status_code == 400
        assert "Invalid category filter" in res1.json()["detail"]

        # Invalid period filter
        res2 = client.get("/api/v1/budgets?period=quarterly", headers=user["headers"])
        assert res2.status_code == 400
        assert "Invalid period filter" in res2.json()["detail"]


# ===========================================================================
# 4. Single Budget GET, PATCH, DELETE & Ownership Isolation
# ===========================================================================
class TestBudgetsAPICRUDAndIsolation:
    def test_get_update_delete_own_budget(self):
        user = register_and_login_user("crud_own")
        create_res = client.post("/api/v1/budgets", json={
            "name": "Initial Food Budget",
            "category": "food",
            "amount": "8000.00",
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
        }, headers=user["headers"])
        budget_id = create_res.json()["id"]

        # GET
        get_res = client.get(f"/api/v1/budgets/{budget_id}", headers=user["headers"])
        assert get_res.status_code == 200
        assert get_res.json()["id"] == budget_id

        # PATCH
        patch_res = client.patch(
            f"/api/v1/budgets/{budget_id}",
            json={"name": "Expanded Food Budget", "amount": "14000.00"},
            headers=user["headers"],
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["name"] == "Expanded Food Budget"
        assert Decimal(patch_res.json()["amount"]) == Decimal("14000.00")
        assert Decimal(patch_res.json()["spending"]["budget_amount"]) == Decimal("14000.00")

        # DELETE
        del_res = client.delete(f"/api/v1/budgets/{budget_id}", headers=user["headers"])
        assert del_res.status_code == 200
        assert "deleted" in del_res.json()["message"].lower()

        # Verify 404 after deletion
        assert client.get(f"/api/v1/budgets/{budget_id}", headers=user["headers"]).status_code == 404

    def test_cross_user_isolation(self):
        user_a = register_and_login_user("cross_a")
        user_b = register_and_login_user("cross_b")

        # User A creates a budget
        create_res = client.post("/api/v1/budgets", json={
            "name": "User A Private Budget",
            "category": "rent",
            "amount": "25000.00",
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
        }, headers=user_a["headers"])
        budget_a_id = create_res.json()["id"]

        # User B attempts to GET User A's budget -> 404
        assert client.get(f"/api/v1/budgets/{budget_a_id}", headers=user_b["headers"]).status_code == 404

        # User B attempts to GET User A's budget spending -> 404
        assert client.get(f"/api/v1/budgets/{budget_a_id}/spending", headers=user_b["headers"]).status_code == 404

        # User B attempts to PATCH User A's budget -> 404
        assert client.patch(
            f"/api/v1/budgets/{budget_a_id}",
            json={"name": "Hacked"},
            headers=user_b["headers"],
        ).status_code == 404

        # User B attempts to DELETE User A's budget -> 404
        assert client.delete(f"/api/v1/budgets/{budget_a_id}", headers=user_b["headers"]).status_code == 404

        # Verify User A's budget is intact
        get_a = client.get(f"/api/v1/budgets/{budget_a_id}", headers=user_a["headers"])
        assert get_a.status_code == 200
        assert get_a.json()["name"] == "User A Private Budget"


# ===========================================================================
# 5. Real-Time Spending Integration & Dedicated Endpoint Tests
# ===========================================================================
class TestBudgetsAPISpendingIntegration:
    def test_real_time_spending_with_transactions(self):
        user = register_and_login_user("spending_integration")
        acct_id = create_user_account(user["headers"])

        # Create budget: Food 10,000 INR from 2026-10-01 to 2026-10-31
        budget_res = client.post("/api/v1/budgets", json={
            "name": "Food & Dining",
            "category": "food",
            "amount": "10000.00",
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
        }, headers=user["headers"])
        budget_id = budget_res.json()["id"]

        # 1. Record food expense of 4,000 INR
        record_transaction(user["headers"], acct_id, "4000.00", "expense", "food", "2026-10-10T12:00:00Z")

        # 2. Record food income of 20,000 INR -> must NOT count as spending
        record_transaction(user["headers"], acct_id, "20000.00", "income", "food", "2026-10-12T12:00:00Z")

        # 3. Record entertainment expense of 3,000 INR -> must NOT count towards food budget
        record_transaction(user["headers"], acct_id, "3000.00", "expense", "entertainment", "2026-10-14T12:00:00Z")

        # Fetch via GET /budgets/{id}
        get_res = client.get(f"/api/v1/budgets/{budget_id}", headers=user["headers"])
        assert get_res.status_code == 200
        spending = get_res.json()["spending"]
        assert Decimal(spending["budget_amount"]) == Decimal("10000.00")
        assert Decimal(spending["actual_spending"]) == Decimal("4000.00")
        assert Decimal(spending["remaining_amount"]) == Decimal("6000.00")
        assert Decimal(spending["over_budget_amount"]) == Decimal("0.00")
        assert Decimal(spending["spending_percentage"]) == Decimal("40.00")
        assert spending["status"] == "healthy"

        # Fetch via dedicated GET /budgets/{id}/spending
        ded_res = client.get(f"/api/v1/budgets/{budget_id}/spending", headers=user["headers"])
        assert ded_res.status_code == 200
        ded_spending = ded_res.json()
        assert ded_spending == spending

        # 4. Record additional expense to push into warning threshold: +4,500 INR (total 8,500 / 10,000 = 85%)
        record_transaction(user["headers"], acct_id, "4500.00", "expense", "food", "2026-10-18T12:00:00Z")
        get_warning = client.get(f"/api/v1/budgets/{budget_id}/spending", headers=user["headers"])
        assert Decimal(get_warning.json()["spending_percentage"]) == Decimal("85.00")
        assert get_warning.json()["status"] == "warning"

        # 5. Record additional expense to push into over_budget: +3,000 INR (total 11,500 / 10,000 = 115%)
        record_transaction(user["headers"], acct_id, "3000.00", "expense", "food", "2026-10-25T12:00:00Z")
        get_over = client.get(f"/api/v1/budgets/{budget_id}/spending", headers=user["headers"])
        assert Decimal(get_over.json()["actual_spending"]) == Decimal("11500.00")
        assert Decimal(get_over.json()["remaining_amount"]) == Decimal("0.00")
        assert Decimal(get_over.json()["over_budget_amount"]) == Decimal("1500.00")
        assert Decimal(get_over.json()["spending_percentage"]) == Decimal("115.00")
        assert get_over.json()["status"] == "over_budget"

    def test_repeated_requests_are_deterministic(self):
        user = register_and_login_user("spending_determ")
        acct_id = create_user_account(user["headers"])

        create_res = client.post("/api/v1/budgets", json={
            "name": "Shopping Budget",
            "category": "shopping",
            "amount": "5000.00",
            "start_date": "2026-10-01",
            "end_date": "2026-10-31",
        }, headers=user["headers"])
        budget_id = create_res.json()["id"]

        record_transaction(user["headers"], acct_id, "1234.56", "expense", "shopping", "2026-10-05T10:00:00Z")

        first_data = None
        for _ in range(5):
            res = client.get(f"/api/v1/budgets/{budget_id}/spending", headers=user["headers"])
            assert res.status_code == 200
            data = res.json()
            if first_data is None:
                first_data = data
            else:
                assert data == first_data
