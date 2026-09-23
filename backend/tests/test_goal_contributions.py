"""
Financial Goal Contribution Ledger Tests (Phase 4A Part 3).

Comprehensive unit and integration tests covering:
- Model and schema validation (positive amount, date, sanitized notes)
- Contribution recording with strict goal & user scoping
- Cap enforcement (cumulative contributions cannot exceed goal target_amount)
- Ledger aggregation (SUM of valid contributions with Decimal precision)
- Strict cross-user isolation and ownership verification
- REST API endpoint verification (POST, GET list with filters/pagination, GET by ID, DELETE)
- Unauthenticated access rejection (401)
- Repeated deterministic calculations
"""
from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.core.database import SessionLocal
from app.models.financial_goal import FinancialGoal
from app.models.financial_goal_contribution import FinancialGoalContribution
from app.models.user import User
from app.schemas.goal_contributions import (
    GoalContributionCreate,
    GoalContributionRead,
)
from app.schemas.goals import FinancialGoalCreate
from app.services.goal_service import GoalService
from app.services.goal_contribution_service import GoalContributionService

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper to register and login a distinct user, returning user payload and auth headers."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"Contrib User {uid} {name_suffix}".strip(),
        "email": f"contrib_user_{uid}_{name_suffix.lower()}@example.com",
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


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def create_test_user_in_db(db) -> User:
    uid = uuid.uuid4().hex[:8]
    user = User(
        id=uuid.uuid4(),
        full_name=f"Direct User {uid}",
        email=f"direct_contrib_{uid}@example.com",
        password_hash="mock_hash_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ===========================================================================
# 1. Model & Schema Validation Tests
# ===========================================================================
class TestGoalContributionSchemaValidation:
    def test_valid_contribution_schema(self):
        c_date = date.today()
        payload = GoalContributionCreate(
            amount=Decimal("5000.00"),
            contribution_date=c_date,
            note="Monthly SIP allocation",
        )
        assert payload.amount == Decimal("5000.00")
        assert payload.contribution_date == c_date
        assert payload.note == "Monthly SIP allocation"

    def test_zero_amount_rejected(self):
        with pytest.raises(ValidationError):
            GoalContributionCreate(
                amount=Decimal("0.00"),
                contribution_date=date.today(),
            )

    def test_negative_amount_rejected(self):
        with pytest.raises(ValidationError):
            GoalContributionCreate(
                amount=Decimal("-100.00"),
                contribution_date=date.today(),
            )

    def test_note_sanitization(self):
        payload = GoalContributionCreate(
            amount=Decimal("1500.00"),
            contribution_date=date.today(),
            note="   Savings from bonus   ",
        )
        assert payload.note == "Savings from bonus"

        payload_empty_note = GoalContributionCreate(
            amount=Decimal("1500.00"),
            contribution_date=date.today(),
            note="   ",
        )
        assert payload_empty_note.note is None


# ===========================================================================
# 2. Service-Level Aggregation & Constraint Tests
# ===========================================================================
class TestGoalContributionService:
    def test_calculate_goal_current_amount_empty(self, db):
        user = create_test_user_in_db(db)
        goal = GoalService.create_goal(
            db,
            user.id,
            FinancialGoalCreate(
                name="Empty Goal",
                goal_type="travel",
                target_amount=Decimal("50000.00"),
                target_date=date.today() + timedelta(days=90),
            ),
        )
        total = GoalContributionService.calculate_goal_current_amount(db, user.id, goal.id)
        assert total == Decimal("0.00")

    def test_multiple_contributions_and_exact_decimal_sum(self, db):
        user = create_test_user_in_db(db)
        goal = GoalService.create_goal(
            db,
            user.id,
            FinancialGoalCreate(
                name="Retirement Fund",
                goal_type="retirement",
                target_amount=Decimal("100000.00"),
                target_date=date.today() + timedelta(days=365),
            ),
        )

        # Record 3 contributions
        GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("25000.50"), contribution_date=date(2026, 1, 10)),
        )
        GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("14999.50"), contribution_date=date(2026, 2, 10)),
        )
        GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("10000.00"), contribution_date=date(2026, 3, 10)),
        )

        total = GoalContributionService.calculate_goal_current_amount(db, user.id, goal.id)
        assert total == Decimal("50000.00")

        summary = GoalContributionService.get_goal_contributions_summary(db, user.id, goal.id)
        assert summary.total_contributions == Decimal("50000.00")
        assert summary.contribution_count == 3
        assert summary.latest_contribution_date == date(2026, 3, 10)

    def test_contribution_exceeding_goal_target_rejected(self, db):
        user = create_test_user_in_db(db)
        goal = GoalService.create_goal(
            db,
            user.id,
            FinancialGoalCreate(
                name="Emergency Cap Test",
                goal_type="emergency_fund",
                target_amount=Decimal("100000.00"),
                target_date=date.today() + timedelta(days=180),
            ),
        )

        # First contribution: 80,000
        GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("80000.00"), contribution_date=date.today()),
        )

        # Attempt second contribution of 30,000 (total would be 110,000 > 100,000)
        with pytest.raises(Exception) as exc_info:
            GoalContributionService.create_contribution(
                db, user.id, goal.id,
                GoalContributionCreate(amount=Decimal("30000.00"), contribution_date=date.today()),
            )
        assert "exceeds" in str(exc_info.value).lower()

        # Exact completion contribution of 20,000 should succeed
        completed_contrib = GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("20000.00"), contribution_date=date.today()),
        )
        assert completed_contrib.amount == Decimal("20000.00")

        total = GoalContributionService.calculate_goal_current_amount(db, user.id, goal.id)
        assert total == Decimal("100000.00")

    def test_deletion_recalculates_aggregated_total(self, db):
        user = create_test_user_in_db(db)
        goal = GoalService.create_goal(
            db,
            user.id,
            FinancialGoalCreate(
                name="Delete Recalc Test",
                goal_type="other",
                target_amount=Decimal("50000.00"),
                target_date=date.today() + timedelta(days=90),
            ),
        )

        c1 = GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("15000.00"), contribution_date=date.today()),
        )
        c2 = GoalContributionService.create_contribution(
            db, user.id, goal.id,
            GoalContributionCreate(amount=Decimal("10000.00"), contribution_date=date.today()),
        )
        assert GoalContributionService.calculate_goal_current_amount(db, user.id, goal.id) == Decimal("25000.00")

        # Delete c1
        deleted = GoalContributionService.delete_contribution(db, user.id, goal.id, c1.id)
        assert deleted is True

        assert GoalContributionService.calculate_goal_current_amount(db, user.id, goal.id) == Decimal("10000.00")


# ===========================================================================
# 3. API Authentication Tests
# ===========================================================================
class TestGoalContributionsAPIAuth:
    def test_unauthenticated_requests_rejected(self):
        dummy_goal = str(uuid.uuid4())
        dummy_contrib = str(uuid.uuid4())

        # POST
        res1 = client.post(
            f"/api/v1/goals/{dummy_goal}/contributions",
            json={"amount": "1000.00", "contribution_date": date.today().isoformat()},
        )
        assert res1.status_code == 401

        # GET list
        res2 = client.get(f"/api/v1/goals/{dummy_goal}/contributions")
        assert res2.status_code == 401

        # GET single
        res3 = client.get(f"/api/v1/goals/{dummy_goal}/contributions/{dummy_contrib}")
        assert res3.status_code == 401

        # DELETE
        res4 = client.delete(f"/api/v1/goals/{dummy_goal}/contributions/{dummy_contrib}")
        assert res4.status_code == 401


# ===========================================================================
# 4. API Endpoints & CRUD Tests
# ===========================================================================
class TestGoalContributionsAPI:
    def test_create_and_get_contribution(self):
        user = register_and_login_user("create_contrib")
        target_d = (date.today() + timedelta(days=180)).isoformat()

        # Create goal
        goal_res = client.post("/api/v1/goals", json={
            "name": "Wedding Savings", "goal_type": "other",
            "target_amount": "500000.00", "target_date": target_d,
        }, headers=user["headers"])
        assert goal_res.status_code == 201
        goal_id = goal_res.json()["id"]

        # Record contribution
        contrib_date = date.today().isoformat()
        contrib_res = client.post(
            f"/api/v1/goals/{goal_id}/contributions",
            json={
                "amount": "50000.00",
                "contribution_date": contrib_date,
                "note": "Initial transfer",
            },
            headers=user["headers"],
        )
        assert contrib_res.status_code == 201
        contrib_data = contrib_res.json()
        assert contrib_data["goal_id"] == goal_id
        assert contrib_data["user_id"] == user["user"]["id"]
        assert Decimal(contrib_data["amount"]) == Decimal("50000.00")
        assert contrib_data["contribution_date"] == contrib_date
        assert contrib_data["note"] == "Initial transfer"
        contrib_id = contrib_data["id"]

        # Get single contribution
        get_res = client.get(
            f"/api/v1/goals/{goal_id}/contributions/{contrib_id}",
            headers=user["headers"],
        )
        assert get_res.status_code == 200
        assert get_res.json()["id"] == contrib_id

    def test_contribution_for_nonexistent_goal_returns_404(self):
        user = register_and_login_user("contrib_nonexistent")
        random_goal = str(uuid.uuid4())
        res = client.post(
            f"/api/v1/goals/{random_goal}/contributions",
            json={"amount": "1000.00", "contribution_date": date.today().isoformat()},
            headers=user["headers"],
        )
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()

    def test_list_contributions_sorting_and_filtering(self):
        user = register_and_login_user("list_contrib_filters")
        target_d = (date.today() + timedelta(days=200)).isoformat()

        goal_res = client.post("/api/v1/goals", json={
            "name": "Trip to Europe", "goal_type": "travel",
            "target_amount": "300000.00", "target_date": target_d,
        }, headers=user["headers"])
        goal_id = goal_res.json()["id"]

        # Create 3 contributions with distinct dates
        d1 = date(2026, 1, 15).isoformat()
        d2 = date(2026, 2, 15).isoformat()
        d3 = date(2026, 3, 15).isoformat()

        client.post(f"/api/v1/goals/{goal_id}/contributions", json={"amount": "10000.00", "contribution_date": d1}, headers=user["headers"])
        client.post(f"/api/v1/goals/{goal_id}/contributions", json={"amount": "20000.00", "contribution_date": d2}, headers=user["headers"])
        client.post(f"/api/v1/goals/{goal_id}/contributions", json={"amount": "30000.00", "contribution_date": d3}, headers=user["headers"])

        # All list (default sorted DESC by date)
        all_res = client.get(f"/api/v1/goals/{goal_id}/contributions", headers=user["headers"])
        assert all_res.status_code == 200
        items = all_res.json()
        assert len(items) == 3
        assert items[0]["contribution_date"] == d3
        assert items[1]["contribution_date"] == d2
        assert items[2]["contribution_date"] == d1

        # Date range filter: 2026-02-01 to 2026-03-01 -> only d2
        filter_res = client.get(
            f"/api/v1/goals/{goal_id}/contributions?start_date=2026-02-01&end_date=2026-03-01",
            headers=user["headers"],
        )
        assert filter_res.status_code == 200
        filtered_items = filter_res.json()
        assert len(filtered_items) == 1
        assert filtered_items[0]["contribution_date"] == d2

        # Pagination: page=1, page_size=2
        page_res = client.get(
            f"/api/v1/goals/{goal_id}/contributions?page=1&page_size=2",
            headers=user["headers"],
        )
        assert page_res.status_code == 200
        assert len(page_res.json()) == 2

    def test_delete_contribution(self):
        user = register_and_login_user("delete_contrib")
        target_d = (date.today() + timedelta(days=90)).isoformat()

        goal_res = client.post("/api/v1/goals", json={
            "name": "Gadget Fund", "goal_type": "purchase",
            "target_amount": "50000.00", "target_date": target_d,
        }, headers=user["headers"])
        goal_id = goal_res.json()["id"]

        create_res = client.post(
            f"/api/v1/goals/{goal_id}/contributions",
            json={"amount": "10000.00", "contribution_date": date.today().isoformat()},
            headers=user["headers"],
        )
        contrib_id = create_res.json()["id"]

        # Delete
        del_res = client.delete(
            f"/api/v1/goals/{goal_id}/contributions/{contrib_id}",
            headers=user["headers"],
        )
        assert del_res.status_code == 200
        assert "deleted" in del_res.json()["message"].lower()

        # Verify subsequent GET returns 404
        get_res = client.get(
            f"/api/v1/goals/{goal_id}/contributions/{contrib_id}",
            headers=user["headers"],
        )
        assert get_res.status_code == 404


# ===========================================================================
# 5. Cross-User Isolation Tests
# ===========================================================================
class TestGoalContributionsUserIsolation:
    def test_user_a_and_user_b_isolation(self):
        user_a = register_and_login_user("cross_contrib_a")
        user_b = register_and_login_user("cross_contrib_b")

        target_d = (date.today() + timedelta(days=120)).isoformat()

        # User A creates a goal and records a contribution
        goal_a_res = client.post("/api/v1/goals", json={
            "name": "User A Goal", "goal_type": "investment",
            "target_amount": "100000.00", "target_date": target_d,
        }, headers=user_a["headers"])
        goal_a_id = goal_a_res.json()["id"]

        contrib_a_res = client.post(
            f"/api/v1/goals/{goal_a_id}/contributions",
            json={"amount": "20000.00", "contribution_date": date.today().isoformat()},
            headers=user_a["headers"],
        )
        contrib_a_id = contrib_a_res.json()["id"]

        # 1. User B cannot add contribution to User A's goal -> 404
        post_b_res = client.post(
            f"/api/v1/goals/{goal_a_id}/contributions",
            json={"amount": "5000.00", "contribution_date": date.today().isoformat()},
            headers=user_b["headers"],
        )
        assert post_b_res.status_code == 404

        # 2. User B cannot list contributions of User A's goal -> 404
        list_b_res = client.get(
            f"/api/v1/goals/{goal_a_id}/contributions",
            headers=user_b["headers"],
        )
        assert list_b_res.status_code == 404

        # 3. User B cannot get User A's contribution -> 404
        get_b_res = client.get(
            f"/api/v1/goals/{goal_a_id}/contributions/{contrib_a_id}",
            headers=user_b["headers"],
        )
        assert get_b_res.status_code == 404

        # 4. User B cannot delete User A's contribution -> 404
        del_b_res = client.delete(
            f"/api/v1/goals/{goal_a_id}/contributions/{contrib_a_id}",
            headers=user_b["headers"],
        )
        assert del_b_res.status_code == 404

        # Verify User A's contribution remains untouched
        get_a_res = client.get(
            f"/api/v1/goals/{goal_a_id}/contributions/{contrib_a_id}",
            headers=user_a["headers"],
        )
        assert get_a_res.status_code == 200
        assert Decimal(get_a_res.json()["amount"]) == Decimal("20000.00")


# ===========================================================================
# 6. Determinism Test
# ===========================================================================
class TestGoalContributionsDeterminism:
    def test_repeated_aggregation_is_identical(self, db):
        user = create_test_user_in_db(db)
        goal = GoalService.create_goal(
            db,
            user.id,
            FinancialGoalCreate(
                name="Determinism Test Goal",
                goal_type="home",
                target_amount=Decimal("1000000.00"),
                target_date=date.today() + timedelta(days=365),
            ),
        )

        for amt in [Decimal("10000.00"), Decimal("25000.00"), Decimal("33333.33")]:
            GoalContributionService.create_contribution(
                db, user.id, goal.id,
                GoalContributionCreate(amount=amt, contribution_date=date.today()),
            )

        expected_sum = Decimal("68333.33")
        for _ in range(5):
            calc_sum = GoalContributionService.calculate_goal_current_amount(db, user.id, goal.id)
            assert calc_sum == expected_sum
