"""
Financial Goals REST API Tests (Phase 4A Part 2).

Comprehensive endpoint tests covering:
- Authentication enforcement (401 on unauthenticated requests)
- Goal creation with validation and strict user_id scoping
- Listing with filtering (status, goal_type, priority), pagination, and derived state
- Filter validation errors (400 Bad Request on invalid query parameters)
- Single goal retrieval with 404 for nonexistent/cross-user goals
- Partial updates with recalculated derived state and cross-field validations
- Goal deletion with cross-user isolation
- Deterministic derived state verification (progress %, remaining, months, required monthly, overdue, completed)
- Repeated GET determinism
"""
from datetime import date, timedelta
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
        "full_name": f"Goal API User {uid} {name_suffix}".strip(),
        "email": f"goal_api_user_{uid}_{name_suffix.lower()}@example.com",
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


# ===========================================================================
# 1. Authentication Enforcement Tests
# ===========================================================================
class TestGoalsAPIAuthentication:
    def test_unauthenticated_post_rejected(self):
        target_d = (date.today() + timedelta(days=90)).isoformat()
        res = client.post(
            "/api/v1/goals",
            json={
                "name": "Unauthorized Goal",
                "goal_type": "emergency_fund",
                "target_amount": "100000.00",
                "target_date": target_d,
            },
        )
        assert res.status_code == 401

    def test_unauthenticated_get_all_rejected(self):
        res = client.get("/api/v1/goals")
        assert res.status_code == 401

    def test_unauthenticated_get_by_id_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.get(f"/api/v1/goals/{random_id}")
        assert res.status_code == 401

    def test_unauthenticated_patch_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.patch(
            f"/api/v1/goals/{random_id}",
            json={"name": "Hacked"},
        )
        assert res.status_code == 401

    def test_unauthenticated_delete_rejected(self):
        random_id = str(uuid.uuid4())
        res = client.delete(f"/api/v1/goals/{random_id}")
        assert res.status_code == 401


# ===========================================================================
# 2. Goal Creation Tests
# ===========================================================================
class TestGoalsAPICreate:
    def test_successful_goal_creation(self):
        user = register_and_login_user("create_success")
        target_d = (date.today() + timedelta(days=365)).isoformat()
        payload = {
            "name": "Down Payment for Home",
            "description": "Savings for 20% down payment",
            "goal_type": "home",
            "target_amount": "2000000.00",
            "current_amount": "500000.00",
            "target_date": target_d,
            "priority": "high",
            "status": "active",
        }
        res = client.post("/api/v1/goals", json=payload, headers=user["headers"])
        assert res.status_code == 201
        data = res.json()

        assert "id" in data
        assert data["user_id"] == user["user"]["id"]
        assert data["name"] == "Down Payment for Home"
        assert data["description"] == "Savings for 20% down payment"
        assert data["goal_type"] == "home"
        assert Decimal(data["target_amount"]) == Decimal("2000000.00")
        assert Decimal(data["current_amount"]) == Decimal("500000.00")
        assert data["target_date"] == target_d
        assert data["priority"] == "high"
        assert data["status"] == "active"
        assert "created_at" in data
        assert "updated_at" in data

        # Verify derived state structure
        assert "derived_state" in data
        derived = data["derived_state"]
        assert Decimal(derived["progress_percentage"]) == Decimal("25.00")
        assert Decimal(derived["remaining_amount"]) == Decimal("1500000.00")
        assert derived["remaining_months"] == 12
        assert Decimal(derived["required_monthly_contribution"]) == Decimal("125000.00")
        assert derived["is_overdue"] is False
        assert derived["is_on_track"] is True

    def test_user_id_cannot_be_injected(self):
        user = register_and_login_user("inject_user_id")
        fake_uid = str(uuid.uuid4())
        target_d = (date.today() + timedelta(days=180)).isoformat()
        payload = {
            "name": "Trip to Japan",
            "goal_type": "travel",
            "target_amount": "300000.00",
            "target_date": target_d,
            "user_id": fake_uid,  # Attempt injection
        }
        res = client.post("/api/v1/goals", json=payload, headers=user["headers"])
        assert res.status_code == 201
        data = res.json()
        assert data["user_id"] == user["user"]["id"]
        assert data["user_id"] != fake_uid

    def test_validation_errors_rejected(self):
        user = register_and_login_user("validation_errors")
        target_d = (date.today() + timedelta(days=90)).isoformat()

        # Zero target
        res = client.post(
            "/api/v1/goals",
            json={"name": "Zero Target", "goal_type": "vehicle", "target_amount": "0.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Negative target
        res = client.post(
            "/api/v1/goals",
            json={"name": "Negative Target", "goal_type": "vehicle", "target_amount": "-1000.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Negative current amount
        res = client.post(
            "/api/v1/goals",
            json={"name": "Negative Current", "goal_type": "vehicle", "target_amount": "50000.00", "current_amount": "-50.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Current > Target
        res = client.post(
            "/api/v1/goals",
            json={"name": "Excess Current", "goal_type": "vehicle", "target_amount": "50000.00", "current_amount": "60000.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Empty name
        res = client.post(
            "/api/v1/goals",
            json={"name": "   ", "goal_type": "vehicle", "target_amount": "50000.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Invalid goal_type
        res = client.post(
            "/api/v1/goals",
            json={"name": "Bad Type", "goal_type": "crypto_gamble", "target_amount": "50000.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Invalid priority
        res = client.post(
            "/api/v1/goals",
            json={"name": "Bad Priority", "goal_type": "travel", "priority": "ultra", "target_amount": "50000.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)

        # Invalid status
        res = client.post(
            "/api/v1/goals",
            json={"name": "Bad Status", "goal_type": "travel", "status": "destroyed", "target_amount": "50000.00", "target_date": target_d},
            headers=user["headers"],
        )
        assert res.status_code in (400, 422)


# ===========================================================================
# 3. List Goals, Filtering, and Pagination Tests
# ===========================================================================
class TestGoalsAPIList:
    def test_list_returns_only_authenticated_user_goals(self):
        user_a = register_and_login_user("list_user_a")
        user_b = register_and_login_user("list_user_b")

        target_d = (date.today() + timedelta(days=120)).isoformat()

        # User A creates 2 goals
        client.post("/api/v1/goals", json={
            "name": "User A Emergency", "goal_type": "emergency_fund",
            "target_amount": "100000.00", "target_date": target_d,
        }, headers=user_a["headers"])
        client.post("/api/v1/goals", json={
            "name": "User A Car", "goal_type": "vehicle",
            "target_amount": "500000.00", "target_date": target_d,
        }, headers=user_a["headers"])

        # User B creates 1 goal
        client.post("/api/v1/goals", json={
            "name": "User B Secret Goal", "goal_type": "investment",
            "target_amount": "1000000.00", "target_date": target_d,
        }, headers=user_b["headers"])

        # User A lists
        res_a = client.get("/api/v1/goals", headers=user_a["headers"])
        assert res_a.status_code == 200
        goals_a = res_a.json()
        assert len(goals_a) == 2
        for g in goals_a:
            assert g["user_id"] == user_a["user"]["id"]
            assert "User A" in g["name"]
            assert "derived_state" in g

        # User B lists
        res_b = client.get("/api/v1/goals", headers=user_b["headers"])
        assert res_b.status_code == 200
        goals_b = res_b.json()
        assert len(goals_b) == 1
        assert goals_b[0]["user_id"] == user_b["user"]["id"]
        assert goals_b[0]["name"] == "User B Secret Goal"

    def test_list_with_filters(self):
        user = register_and_login_user("filters")
        target_d = (date.today() + timedelta(days=150)).isoformat()

        # Create diverse goals
        client.post("/api/v1/goals", json={
            "name": "Active Emergency", "goal_type": "emergency_fund",
            "target_amount": "200000.00", "target_date": target_d,
            "priority": "high", "status": "active",
        }, headers=user["headers"])

        client.post("/api/v1/goals", json={
            "name": "Completed Purchase", "goal_type": "purchase",
            "target_amount": "50000.00", "current_amount": "50000.00",
            "target_date": target_d, "priority": "low", "status": "completed",
        }, headers=user["headers"])

        client.post("/api/v1/goals", json={
            "name": "Paused Travel", "goal_type": "travel",
            "target_amount": "150000.00", "target_date": target_d,
            "priority": "medium", "status": "paused",
        }, headers=user["headers"])

        # Filter by status=completed
        res_status = client.get("/api/v1/goals?status=completed", headers=user["headers"])
        assert res_status.status_code == 200
        data_status = res_status.json()
        assert len(data_status) == 1
        assert data_status[0]["name"] == "Completed Purchase"

        # Filter by goal_type=emergency_fund
        res_type = client.get("/api/v1/goals?goal_type=emergency_fund", headers=user["headers"])
        assert res_type.status_code == 200
        data_type = res_type.json()
        assert len(data_type) == 1
        assert data_type[0]["name"] == "Active Emergency"

        # Filter by priority=medium
        res_priority = client.get("/api/v1/goals?priority=medium", headers=user["headers"])
        assert res_priority.status_code == 200
        data_priority = res_priority.json()
        assert len(data_priority) == 1
        assert data_priority[0]["name"] == "Paused Travel"

    def test_invalid_filter_values_rejected(self):
        user = register_and_login_user("invalid_filters")

        # Invalid status filter
        res1 = client.get("/api/v1/goals?status=invalid_status", headers=user["headers"])
        assert res1.status_code == 400
        assert "Invalid status filter" in res1.json()["detail"]

        # Invalid goal_type filter
        res2 = client.get("/api/v1/goals?goal_type=invalid_type", headers=user["headers"])
        assert res2.status_code == 400
        assert "Invalid goal_type filter" in res2.json()["detail"]

        # Invalid priority filter
        res3 = client.get("/api/v1/goals?priority=invalid_priority", headers=user["headers"])
        assert res3.status_code == 400
        assert "Invalid priority filter" in res3.json()["detail"]

    def test_pagination(self):
        user = register_and_login_user("pagination")
        target_d = (date.today() + timedelta(days=200)).isoformat()

        for i in range(5):
            client.post("/api/v1/goals", json={
                "name": f"Goal Page {i+1}", "goal_type": "investment",
                "target_amount": f"{(i+1)*10000}.00", "target_date": target_d,
            }, headers=user["headers"])

        # Page 1, size 2
        res_p1 = client.get("/api/v1/goals?page=1&page_size=2", headers=user["headers"])
        assert res_p1.status_code == 200
        data_p1 = res_p1.json()
        assert len(data_p1) == 2

        # Page 2, size 2
        res_p2 = client.get("/api/v1/goals?page=2&page_size=2", headers=user["headers"])
        assert res_p2.status_code == 200
        data_p2 = res_p2.json()
        assert len(data_p2) == 2

        # Page 3, size 2 (should return the remaining 1 goal)
        res_p3 = client.get("/api/v1/goals?page=3&page_size=2", headers=user["headers"])
        assert res_p3.status_code == 200
        data_p3 = res_p3.json()
        assert len(data_p3) == 1

        # Items in p1 and p2 must be disjoint
        p1_ids = {g["id"] for g in data_p1}
        p2_ids = {g["id"] for g in data_p2}
        assert p1_ids.isdisjoint(p2_ids)


# ===========================================================================
# 4. Single Goal GET Tests & Ownership Isolation
# ===========================================================================
class TestGoalsAPIGetSingle:
    def test_get_existing_goal(self):
        user = register_and_login_user("get_single")
        target_d = (date.today() + timedelta(days=180)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "Bike Upgrade", "goal_type": "vehicle",
            "target_amount": "150000.00", "current_amount": "30000.00",
            "target_date": target_d,
        }, headers=user["headers"])
        goal_id = create_res.json()["id"]

        get_res = client.get(f"/api/v1/goals/{goal_id}", headers=user["headers"])
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["id"] == goal_id
        assert data["name"] == "Bike Upgrade"
        assert Decimal(data["target_amount"]) == Decimal("150000.00")
        assert Decimal(data["current_amount"]) == Decimal("30000.00")
        assert "derived_state" in data
        assert Decimal(data["derived_state"]["progress_percentage"]) == Decimal("20.00")

    def test_get_nonexistent_goal_returns_404(self):
        user = register_and_login_user("get_404")
        random_id = str(uuid.uuid4())
        res = client.get(f"/api/v1/goals/{random_id}", headers=user["headers"])
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()

    def test_cross_user_get_returns_404(self):
        user_a = register_and_login_user("cross_get_a")
        user_b = register_and_login_user("cross_get_b")

        target_d = (date.today() + timedelta(days=90)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "Secret User A Goal", "goal_type": "other",
            "target_amount": "50000.00", "target_date": target_d,
        }, headers=user_a["headers"])
        goal_a_id = create_res.json()["id"]

        # User B attempts to access User A's goal
        res_b = client.get(f"/api/v1/goals/{goal_a_id}", headers=user_b["headers"])
        assert res_b.status_code == 404
        assert "not found" in res_b.json()["detail"].lower()


# ===========================================================================
# 5. Goal Update Tests
# ===========================================================================
class TestGoalsAPIUpdate:
    def test_successful_patch_and_recalculated_derived_state(self):
        user = register_and_login_user("patch_success")
        target_d = (date.today() + timedelta(days=365)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "Laptop Fund", "goal_type": "purchase",
            "target_amount": "100000.00", "current_amount": "20000.00",
            "target_date": target_d,
        }, headers=user["headers"])
        goal_id = create_res.json()["id"]

        # Initial progress was 20%
        assert Decimal(create_res.json()["derived_state"]["progress_percentage"]) == Decimal("20.00")

        # Update current amount to 60000 and priority to high
        patch_res = client.patch(
            f"/api/v1/goals/{goal_id}",
            json={
                "name": "MacBook Pro Fund",
                "current_amount": "60000.00",
                "priority": "high",
            },
            headers=user["headers"],
        )
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert updated["name"] == "MacBook Pro Fund"
        assert Decimal(updated["current_amount"]) == Decimal("60000.00")
        assert updated["priority"] == "high"

        # Derived state recalculated: progress is now 60%, remaining 40000
        assert Decimal(updated["derived_state"]["progress_percentage"]) == Decimal("60.00")
        assert Decimal(updated["derived_state"]["remaining_amount"]) == Decimal("40000.00")

    def test_patch_cross_field_validation_rejected(self):
        user = register_and_login_user("patch_validation")
        target_d = (date.today() + timedelta(days=90)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "Renovation", "goal_type": "home",
            "target_amount": "200000.00", "current_amount": "50000.00",
            "target_date": target_d,
        }, headers=user["headers"])
        goal_id = create_res.json()["id"]

        # Attempt to set current_amount > target_amount
        res1 = client.patch(
            f"/api/v1/goals/{goal_id}",
            json={"current_amount": "250000.00"},
            headers=user["headers"],
        )
        assert res1.status_code in (400, 422)

        # Attempt to set negative current_amount
        res2 = client.patch(
            f"/api/v1/goals/{goal_id}",
            json={"current_amount": "-500.00"},
            headers=user["headers"],
        )
        assert res2.status_code in (400, 422)

        # Attempt to set invalid status
        res3 = client.patch(
            f"/api/v1/goals/{goal_id}",
            json={"status": "invalid_status_value"},
            headers=user["headers"],
        )
        assert res3.status_code in (400, 422)

    def test_cross_user_patch_rejected(self):
        user_a = register_and_login_user("cross_patch_a")
        user_b = register_and_login_user("cross_patch_b")

        target_d = (date.today() + timedelta(days=90)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "User A Goal", "goal_type": "education",
            "target_amount": "500000.00", "target_date": target_d,
        }, headers=user_a["headers"])
        goal_id = create_res.json()["id"]

        # User B attempts to patch User A's goal -> 404
        patch_res = client.patch(
            f"/api/v1/goals/{goal_id}",
            json={"name": "Hacked Title"},
            headers=user_b["headers"],
        )
        assert patch_res.status_code == 404

        # Verify User A's goal remains unmodified
        get_res = client.get(f"/api/v1/goals/{goal_id}", headers=user_a["headers"])
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "User A Goal"


# ===========================================================================
# 6. Goal Deletion Tests
# ===========================================================================
class TestGoalsAPIDelete:
    def test_successful_deletion(self):
        user = register_and_login_user("delete_success")
        target_d = (date.today() + timedelta(days=60)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "Short Term Goal", "goal_type": "purchase",
            "target_amount": "20000.00", "target_date": target_d,
        }, headers=user["headers"])
        goal_id = create_res.json()["id"]

        # Delete
        del_res = client.delete(f"/api/v1/goals/{goal_id}", headers=user["headers"])
        assert del_res.status_code == 200
        assert "deleted" in del_res.json()["message"].lower()

        # Verify 404 on subsequent GET
        get_res = client.get(f"/api/v1/goals/{goal_id}", headers=user["headers"])
        assert get_res.status_code == 404

    def test_cross_user_delete_rejected(self):
        user_a = register_and_login_user("cross_delete_a")
        user_b = register_and_login_user("cross_delete_b")

        target_d = (date.today() + timedelta(days=60)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "User A Protected Goal", "goal_type": "investment",
            "target_amount": "100000.00", "target_date": target_d,
        }, headers=user_a["headers"])
        goal_id = create_res.json()["id"]

        # User B attempts to delete User A's goal -> 404
        del_res = client.delete(f"/api/v1/goals/{goal_id}", headers=user_b["headers"])
        assert del_res.status_code == 404

        # Verify goal still exists for User A
        get_res = client.get(f"/api/v1/goals/{goal_id}", headers=user_a["headers"])
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "User A Protected Goal"


# ===========================================================================
# 7. Derived Calculations & Determinism Tests
# ===========================================================================
class TestGoalsAPIDerivedCalculations:
    def test_completed_goal_derived_state(self):
        user = register_and_login_user("completed_derived")
        target_d = (date.today() + timedelta(days=90)).isoformat()
        res = client.post("/api/v1/goals", json={
            "name": "Full Emergency Fund", "goal_type": "emergency_fund",
            "target_amount": "300000.00", "current_amount": "300000.00",
            "target_date": target_d, "status": "completed",
        }, headers=user["headers"])
        assert res.status_code == 201
        derived = res.json()["derived_state"]
        assert Decimal(derived["progress_percentage"]) == Decimal("100.00")
        assert Decimal(derived["remaining_amount"]) == Decimal("0.00")
        assert Decimal(derived["required_monthly_contribution"]) == Decimal("0.00")
        assert derived["is_overdue"] is False
        assert derived["is_on_track"] is True

    def test_overdue_goal_derived_state(self):
        user = register_and_login_user("overdue_derived")
        past_target = (date.today() - timedelta(days=30)).isoformat()
        res = client.post("/api/v1/goals", json={
            "name": "Past Due Goal", "goal_type": "other",
            "target_amount": "50000.00", "current_amount": "10000.00",
            "target_date": past_target, "status": "active",
        }, headers=user["headers"])
        assert res.status_code == 201
        derived = res.json()["derived_state"]
        assert Decimal(derived["progress_percentage"]) == Decimal("20.00")
        assert Decimal(derived["remaining_amount"]) == Decimal("40000.00")
        assert derived["remaining_months"] == 0
        assert derived["required_monthly_contribution"] is None
        assert derived["is_overdue"] is True
        assert derived["is_on_track"] is False

    def test_repeated_get_deterministic_results(self):
        user = register_and_login_user("determinism")
        target_d = (date.today() + timedelta(days=365)).isoformat()
        create_res = client.post("/api/v1/goals", json={
            "name": "Deterministic Goal", "goal_type": "retirement",
            "target_amount": "1200000.00", "current_amount": "300000.00",
            "target_date": target_d,
        }, headers=user["headers"])
        goal_id = create_res.json()["id"]

        first_data = None
        for _ in range(5):
            get_res = client.get(f"/api/v1/goals/{goal_id}", headers=user["headers"])
            assert get_res.status_code == 200
            data = get_res.json()
            if first_data is None:
                first_data = data
            else:
                assert data["derived_state"] == first_data["derived_state"]
                assert data["target_amount"] == first_data["target_amount"]
                assert data["current_amount"] == first_data["current_amount"]
