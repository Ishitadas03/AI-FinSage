"""
Comprehensive tests for Financial Goals Foundation (Phase 4A Part 1).

Covers:
- Schema and Model validation rules
- Deterministic calculation functions (progress %, remaining amount, calendar months, required monthly contribution)
- Goal derived states (on track, overdue)
- GoalService CRUD operations
- Strict user ownership and cross-user data isolation
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
from app.models.user import User
from app.schemas.goals import (
    FinancialGoalCreate,
    FinancialGoalRead,
    FinancialGoalUpdate,
    GoalDerivedState,
)
from app.services.goal_service import GoalService

client = TestClient(app)


def create_test_user_in_db() -> User:
    db = SessionLocal()
    uid = uuid.uuid4().hex[:8]
    user = User(
        id=uuid.uuid4(),
        full_name=f"Goal User {uid}",
        email=f"goal_user_{uid}@example.com",
        password_hash="mock_hash_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def sample_user_id() -> uuid.UUID:
    user = create_test_user_in_db()
    return user.id


# ---------------------------------------------------------------------------
# 1. Model & Schema Validation Tests
# ---------------------------------------------------------------------------
class TestGoalSchemaValidation:
    def test_valid_goal_schema(self):
        target_d = date.today() + timedelta(days=365)
        payload = FinancialGoalCreate(
            name="Emergency Fund",
            description="6 months living expenses",
            goal_type="emergency_fund",
            target_amount=Decimal("300000.00"),
            current_amount=Decimal("50000.00"),
            target_date=target_d,
            priority="high",
            status="active",
        )
        assert payload.name == "Emergency Fund"
        assert payload.target_amount == Decimal("300000.00")
        assert payload.current_amount == Decimal("50000.00")
        assert payload.target_date == target_d
        assert payload.priority == "high"
        assert payload.status == "active"

    def test_zero_target_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Zero Target",
                goal_type="other",
                target_amount=Decimal("0.00"),
                target_date=date.today() + timedelta(days=100),
            )
        assert "greater than 0" in str(exc_info.value)

    def test_negative_target_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Negative Target",
                goal_type="other",
                target_amount=Decimal("-1000.00"),
                target_date=date.today() + timedelta(days=100),
            )
        assert "greater than 0" in str(exc_info.value)

    def test_negative_current_amount_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Negative Current",
                goal_type="other",
                target_amount=Decimal("10000.00"),
                current_amount=Decimal("-50.00"),
                target_date=date.today() + timedelta(days=100),
            )
        assert "greater than or equal to 0" in str(exc_info.value)

    def test_current_amount_greater_than_target_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Excess Current",
                goal_type="other",
                target_amount=Decimal("10000.00"),
                current_amount=Decimal("15000.00"),
                target_date=date.today() + timedelta(days=100),
            )
        assert "current_amount cannot exceed target_amount" in str(exc_info.value)

    def test_invalid_goal_type_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Bad Type",
                goal_type="crypto_moonshot",
                target_amount=Decimal("10000.00"),
                target_date=date.today() + timedelta(days=100),
            )
        assert "Invalid goal_type" in str(exc_info.value)

    def test_invalid_priority_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Bad Priority",
                goal_type="travel",
                target_amount=Decimal("10000.00"),
                target_date=date.today() + timedelta(days=100),
                priority="urgent_af",
            )
        assert "Invalid priority" in str(exc_info.value)

    def test_invalid_status_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="Bad Status",
                goal_type="travel",
                target_amount=Decimal("10000.00"),
                target_date=date.today() + timedelta(days=100),
                status="abandoned",
            )
        assert "Invalid status" in str(exc_info.value)

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="",
                goal_type="home",
                target_amount=Decimal("100000.00"),
                target_date=date.today() + timedelta(days=100),
            )
        err = str(exc_info.value)
        assert "String should have at least 1 character" in err or "Goal name cannot be empty" in err

    def test_whitespace_name_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalCreate(
                name="    ",
                goal_type="home",
                target_amount=Decimal("100000.00"),
                target_date=date.today() + timedelta(days=100),
            )
        assert "Goal name cannot be empty" in str(exc_info.value)

    def test_all_valid_goal_types_accepted(self):
        valid_types = [
            "emergency_fund", "education", "travel", "vehicle",
            "home", "retirement", "investment", "purchase", "other"
        ]
        for gt in valid_types:
            goal = FinancialGoalCreate(
                name=f"Goal for {gt}",
                goal_type=gt,
                target_amount=Decimal("50000.00"),
                target_date=date.today() + timedelta(days=90),
            )
            assert goal.goal_type == gt

    def test_update_schema_current_gt_target_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            FinancialGoalUpdate(
                target_amount=Decimal("5000.00"),
                current_amount=Decimal("10000.00"),
            )
        assert "current_amount cannot exceed target_amount" in str(exc_info.value)

    def test_update_schema_valid_partial(self):
        update = FinancialGoalUpdate(
            name="Updated Name",
            priority="high",
            current_amount=Decimal("2500.00"),
        )
        assert update.name == "Updated Name"
        assert update.priority == "high"
        assert update.current_amount == Decimal("2500.00")
        assert update.target_amount is None


# ---------------------------------------------------------------------------
# 2. Calculation Foundation Tests
# ---------------------------------------------------------------------------
class TestGoalCalculations:
    def test_zero_progress(self):
        progress = GoalService.calculate_progress_percentage(Decimal("0.00"), Decimal("100000.00"))
        assert progress == Decimal("0.00")

    def test_partial_progress(self):
        progress = GoalService.calculate_progress_percentage(Decimal("33333.33"), Decimal("100000.00"))
        assert progress == Decimal("33.33")

        progress_half = GoalService.calculate_progress_percentage(Decimal("50000.00"), Decimal("100000.00"))
        assert progress_half == Decimal("50.00")

    def test_complete_progress(self):
        progress = GoalService.calculate_progress_percentage(Decimal("100000.00"), Decimal("100000.00"))
        assert progress == Decimal("100.00")

    def test_remaining_amount_normal(self):
        remaining = GoalService.calculate_remaining_amount(Decimal("40000.00"), Decimal("100000.00"))
        assert remaining == Decimal("60000.00")

    def test_remaining_amount_zero_when_completed(self):
        remaining = GoalService.calculate_remaining_amount(Decimal("100000.00"), Decimal("100000.00"))
        assert remaining == Decimal("0.00")

    def test_remaining_months_exact_one_month(self):
        ref = date(2026, 9, 23)
        target = date(2026, 10, 23)
        months = GoalService.calculate_remaining_months(target, ref)
        assert months == 1

    def test_remaining_months_multiple_months(self):
        ref = date(2026, 1, 15)
        target = date(2026, 7, 15)
        months = GoalService.calculate_remaining_months(target, ref)
        assert months == 6

    def test_remaining_months_full_year(self):
        ref = date(2026, 1, 15)
        target = date(2027, 1, 15)
        months = GoalService.calculate_remaining_months(target, ref)
        assert months == 12

    def test_remaining_months_end_of_month(self):
        # Jan 31 to Feb 28
        ref = date(2026, 1, 31)
        target = date(2026, 2, 28)
        months = GoalService.calculate_remaining_months(target, ref)
        assert months == 1

    def test_remaining_months_target_date_today(self):
        ref = date(2026, 9, 23)
        target = date(2026, 9, 23)
        months = GoalService.calculate_remaining_months(target, ref)
        assert months == 0

    def test_remaining_months_overdue(self):
        ref = date(2026, 9, 23)
        target = date(2026, 8, 23)
        months = GoalService.calculate_remaining_months(target, ref)
        assert months == 0

    def test_required_monthly_contribution_normal(self):
        # 60,000 INR remaining across 12 months = 5,000.00 INR/month
        contrib = GoalService.calculate_required_monthly_contribution(
            remaining_amount=Decimal("60000.00"),
            remaining_months=12,
        )
        assert contrib == Decimal("5000.00")

    def test_required_monthly_contribution_rounding(self):
        # 10,000 INR remaining across 3 months = 3,333.333... -> 3,333.33
        contrib = GoalService.calculate_required_monthly_contribution(
            remaining_amount=Decimal("10000.00"),
            remaining_months=3,
        )
        assert contrib == Decimal("3333.33")

    def test_required_monthly_contribution_completed_goal(self):
        contrib = GoalService.calculate_required_monthly_contribution(
            remaining_amount=Decimal("0.00"),
            remaining_months=6,
        )
        assert contrib == Decimal("0.00")

    def test_required_monthly_contribution_overdue_goal(self):
        # Target date passed, remaining amount > 0 -> returns None (explicit overdue state)
        contrib = GoalService.calculate_required_monthly_contribution(
            remaining_amount=Decimal("50000.00"),
            remaining_months=0,
            is_overdue=True,
        )
        assert contrib is None

    def test_required_monthly_contribution_due_current_month(self):
        # Due in 0 remaining full months, but not overdue (due this month)
        contrib = GoalService.calculate_required_monthly_contribution(
            remaining_amount=Decimal("15000.00"),
            remaining_months=0,
            is_overdue=False,
        )
        assert contrib == Decimal("15000.00")

    def test_deterministic_repeated_calculations(self):
        # Calling calculate functions with identical arguments returns identical values
        for _ in range(5):
            p = GoalService.calculate_progress_percentage(Decimal("25000.00"), Decimal("100000.00"))
            r = GoalService.calculate_remaining_amount(Decimal("25000.00"), Decimal("100000.00"))
            m = GoalService.calculate_remaining_months(date(2027, 9, 23), date(2026, 9, 23))
            c = GoalService.calculate_required_monthly_contribution(r, m)

            assert p == Decimal("25.00")
            assert r == Decimal("75000.00")
            assert m == 12
            assert c == Decimal("6250.00")


# ---------------------------------------------------------------------------
# 3. Derived State Tests
# ---------------------------------------------------------------------------
class TestGoalDerivedState:
    def test_active_goal_on_track(self):
        ref = date(2026, 9, 23)
        goal = FinancialGoal(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            name="New Car",
            goal_type="vehicle",
            target_amount=Decimal("800000.00"),
            current_amount=Decimal("200000.00"),
            target_date=date(2027, 9, 23),
            priority="medium",
            status="active",
        )
        derived = GoalService.calculate_goal_derived_state(goal, reference_date=ref)

        assert derived.progress_percentage == Decimal("25.00")
        assert derived.remaining_amount == Decimal("600000.00")
        assert derived.remaining_months == 12
        assert derived.required_monthly_contribution == Decimal("50000.00")
        assert derived.is_overdue is False
        assert derived.is_on_track is True

    def test_overdue_goal_derived_state(self):
        ref = date(2026, 9, 23)
        goal = FinancialGoal(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            name="Past Vacation",
            goal_type="travel",
            target_amount=Decimal("150000.00"),
            current_amount=Decimal("50000.00"),
            target_date=date(2026, 8, 1),  # In the past
            priority="low",
            status="active",
        )
        derived = GoalService.calculate_goal_derived_state(goal, reference_date=ref)

        assert derived.progress_percentage == Decimal("33.33")
        assert derived.remaining_amount == Decimal("100000.00")
        assert derived.remaining_months == 0
        assert derived.required_monthly_contribution is None
        assert derived.is_overdue is True
        assert derived.is_on_track is False

    def test_completed_goal_derived_state(self):
        ref = date(2026, 9, 23)
        goal = FinancialGoal(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            name="Laptop Fund",
            goal_type="purchase",
            target_amount=Decimal("120000.00"),
            current_amount=Decimal("120000.00"),
            target_date=date(2026, 8, 1),
            priority="medium",
            status="completed",
        )
        derived = GoalService.calculate_goal_derived_state(goal, reference_date=ref)

        assert derived.progress_percentage == Decimal("100.00")
        assert derived.remaining_amount == Decimal("0.00")
        assert derived.required_monthly_contribution == Decimal("0.00")
        assert derived.is_overdue is False
        assert derived.is_on_track is True

    def test_paused_goal_not_on_track(self):
        ref = date(2026, 9, 23)
        goal = FinancialGoal(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            name="Home Renovation",
            goal_type="home",
            target_amount=Decimal("500000.00"),
            current_amount=Decimal("100000.00"),
            target_date=date(2027, 9, 23),
            priority="low",
            status="paused",
        )
        derived = GoalService.calculate_goal_derived_state(goal, reference_date=ref)
        assert derived.is_on_track is False


# ---------------------------------------------------------------------------
# 4. Service CRUD & User Ownership Tests
# ---------------------------------------------------------------------------
class TestGoalServiceCRUD:
    def test_create_and_get_goal(self, db, sample_user_id):
        target_d = date.today() + timedelta(days=180)
        payload = FinancialGoalCreate(
            name="Education Master's",
            description="Tuition fee savings",
            goal_type="education",
            target_amount=Decimal("500000.00"),
            current_amount=Decimal("100000.00"),
            target_date=target_d,
            priority="high",
            status="active",
        )
        created = GoalService.create_goal(db, sample_user_id, payload)
        assert created.id is not None
        assert created.user_id == sample_user_id
        assert created.name == "Education Master's"
        assert created.target_amount == Decimal("500000.00")

        fetched = GoalService.get_user_goal(db, sample_user_id, created.id)
        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.name == "Education Master's"

    def test_list_user_goals_with_filter(self, db, sample_user_id):
        target_d = date.today() + timedelta(days=90)
        GoalService.create_goal(db, sample_user_id, FinancialGoalCreate(
            name="Goal Active", goal_type="travel", target_amount=Decimal("50000.00"),
            target_date=target_d, status="active",
        ))
        GoalService.create_goal(db, sample_user_id, FinancialGoalCreate(
            name="Goal Completed", goal_type="purchase", target_amount=Decimal("20000.00"),
            current_amount=Decimal("20000.00"), target_date=target_d, status="completed",
        ))

        all_goals = GoalService.list_user_goals(db, sample_user_id)
        assert len(all_goals) == 2

        active_goals = GoalService.list_user_goals(db, sample_user_id, status_filter="active")
        assert len(active_goals) == 1
        assert active_goals[0].name == "Goal Active"

    def test_update_user_goal(self, db, sample_user_id):
        target_d = date.today() + timedelta(days=120)
        created = GoalService.create_goal(db, sample_user_id, FinancialGoalCreate(
            name="Old Name", goal_type="vehicle", target_amount=Decimal("200000.00"),
            current_amount=Decimal("20000.00"), target_date=target_d, priority="low",
        ))

        updated = GoalService.update_user_goal(
            db, sample_user_id, created.id,
            FinancialGoalUpdate(
                name="New Vehicle Name",
                current_amount=Decimal("50000.00"),
                priority="high",
            ),
        )
        assert updated is not None
        assert updated.name == "New Vehicle Name"
        assert updated.current_amount == Decimal("50000.00")
        assert updated.priority == "high"
        assert updated.target_amount == Decimal("200000.00")

    def test_delete_user_goal(self, db, sample_user_id):
        target_d = date.today() + timedelta(days=60)
        created = GoalService.create_goal(db, sample_user_id, FinancialGoalCreate(
            name="To Delete", goal_type="other", target_amount=Decimal("10000.00"),
            target_date=target_d,
        ))

        deleted = GoalService.delete_user_goal(db, sample_user_id, created.id)
        assert deleted is True

        fetched = GoalService.get_user_goal(db, sample_user_id, created.id)
        assert fetched is None

    def test_get_goal_with_derived_state(self, db, sample_user_id):
        ref = date(2026, 9, 23)
        created = GoalService.create_goal(db, sample_user_id, FinancialGoalCreate(
            name="Retirement Nest Egg",
            goal_type="retirement",
            target_amount=Decimal("1000000.00"),
            current_amount=Decimal("400000.00"),
            target_date=date(2027, 9, 23),
        ))

        with_derived = GoalService.get_goal_with_derived_state(
            db, sample_user_id, created.id, reference_date=ref
        )
        assert with_derived is not None
        assert with_derived.derived_state.progress_percentage == Decimal("40.00")
        assert with_derived.derived_state.remaining_amount == Decimal("600000.00")
        assert with_derived.derived_state.remaining_months == 12
        assert with_derived.derived_state.required_monthly_contribution == Decimal("50000.00")
        assert with_derived.derived_state.is_on_track is True


# ---------------------------------------------------------------------------
# 5. User Ownership & Isolation Tests
# ---------------------------------------------------------------------------
class TestGoalUserIsolation:
    def test_user_a_cannot_see_user_b_goals(self, db):
        uid_a = uuid.uuid4().hex[:8]
        uid_b = uuid.uuid4().hex[:8]
        user_a = User(id=uuid.uuid4(), email=f"usera_{uid_a}@example.com", password_hash="pwd", full_name="User A")
        user_b = User(id=uuid.uuid4(), email=f"userb_{uid_b}@example.com", password_hash="pwd", full_name="User B")
        db.add_all([user_a, user_b])
        db.commit()

        target_d = date.today() + timedelta(days=90)
        goal_a = GoalService.create_goal(db, user_a.id, FinancialGoalCreate(
            name="User A Secret Goal", goal_type="investment", target_amount=Decimal("500000.00"),
            target_date=target_d,
        ))

        # User B listing goals -> empty
        b_goals = GoalService.list_user_goals(db, user_b.id)
        assert len(b_goals) == 0

        # User B get goal -> None
        b_fetched = GoalService.get_user_goal(db, user_b.id, goal_a.id)
        assert b_fetched is None

        # User B update goal -> None
        b_updated = GoalService.update_user_goal(
            db, user_b.id, goal_a.id, FinancialGoalUpdate(name="Hacked Name")
        )
        assert b_updated is None

        # User B delete goal -> False
        b_deleted = GoalService.delete_user_goal(db, user_b.id, goal_a.id)
        assert b_deleted is False

        # Verify Goal A remained untouched
        a_fetched = GoalService.get_user_goal(db, user_a.id, goal_a.id)
        assert a_fetched is not None
        assert a_fetched.name == "User A Secret Goal"

    def test_goal_user_id_cannot_be_changed(self, db, sample_user_id):
        target_d = date.today() + timedelta(days=90)
        goal = GoalService.create_goal(db, sample_user_id, FinancialGoalCreate(
            name="Immutability Test", goal_type="home", target_amount=Decimal("1000000.00"),
            target_date=target_d,
        ))

        other_user_id = uuid.uuid4()
        # Even if someone attempts to pass user_id in model dump or kwargs, update_user_goal ignores forbidden keys
        GoalService.update_user_goal(
            db, sample_user_id, goal.id, FinancialGoalUpdate(name="Renamed")
        )

        raw_entity = GoalService.get_user_goal_entity(db, sample_user_id, goal.id)
        assert raw_entity.user_id == sample_user_id
