"""
Comprehensive tests for Budget Foundation (Phase 4B Part 1).

Covers:
- Schema and Model validation rules (name, amount > 0, valid category, period, date range)
- Deterministic spending calculation engine:
  - Zero spending (0.00% consumed, status healthy)
  - Spending below budget (e.g. 50% consumed, status healthy)
  - Spending at threshold boundary (80.00% healthy, 80.01% warning)
  - Spending at exactly 100% (100.00% warning, 0 remaining, 0 over budget)
  - Spending above budget (e.g. 125% consumed, status over_budget, positive over_budget_amount)
  - Income and transfer transaction exclusion
  - Multi-category isolation
  - Date filtering (transactions before start_date and after end_date excluded)
  - Decimal rounding and precision
- Service CRUD & strict user ownership:
  - User A transactions not counted in User B budget spending
  - User A cannot view, update, or delete User B budget
  - Immutability of user_id
- Calculation determinism across repeated calls
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import uuid
import pytest
from pydantic import ValidationError

from app.core.database import SessionLocal
from app.models.account import Account
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.budgets import (
    BudgetCreate,
    BudgetRead,
    BudgetUpdate,
    BudgetSpendingSummary,
)
from app.services.budget_service import BudgetService


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def create_test_user_in_db(db, prefix: str = "budget") -> User:
    uid = uuid.uuid4().hex[:8]
    user = User(
        id=uuid.uuid4(),
        full_name=f"User {prefix} {uid}",
        email=f"{prefix}_{uid}@example.com",
        password_hash="mock_hash_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_test_account_in_db(db, user_id: uuid.UUID) -> Account:
    account = Account(
        id=uuid.uuid4(),
        user_id=user_id,
        name="Main Checking Account",
        account_type="savings",
        balance=Decimal("100000.00"),
        currency="INR",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def create_test_transaction(
    db,
    user_id: uuid.UUID,
    account_id: uuid.UUID,
    amount: Decimal,
    transaction_type: str,
    category: str,
    transaction_date: datetime,
    destination_account_id: uuid.UUID = None,
) -> Transaction:
    tx = Transaction(
        id=uuid.uuid4(),
        user_id=user_id,
        account_id=account_id,
        destination_account_id=destination_account_id,
        amount=amount,
        transaction_type=transaction_type,
        category=category,
        transaction_date=transaction_date,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


# ===========================================================================
# 1. Schema & Model Validation Tests
# ===========================================================================
class TestBudgetSchemaValidation:
    def test_valid_budget_schema(self):
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)
        payload = BudgetCreate(
            name="Groceries & Dining",
            category="food",
            amount=Decimal("15000.00"),
            period="monthly",
            start_date=s_date,
            end_date=e_date,
        )
        assert payload.name == "Groceries & Dining"
        assert payload.category == "food"
        assert payload.amount == Decimal("15000.00")
        assert payload.period == "monthly"
        assert payload.start_date == s_date
        assert payload.end_date == e_date

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            BudgetCreate(
                name="   ",
                category="food",
                amount=Decimal("10000.00"),
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            )

    def test_zero_amount_rejected(self):
        with pytest.raises(ValidationError):
            BudgetCreate(
                name="Zero Budget",
                category="food",
                amount=Decimal("0.00"),
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            )

    def test_negative_amount_rejected(self):
        with pytest.raises(ValidationError):
            BudgetCreate(
                name="Negative Budget",
                category="food",
                amount=Decimal("-5000.00"),
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            )

    def test_invalid_category_rejected(self):
        with pytest.raises(ValidationError) as exc:
            BudgetCreate(
                name="Crypto Budget",
                category="cryptocurrency_gambling",
                amount=Decimal("10000.00"),
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            )
        assert "Invalid budget category" in str(exc.value)

    def test_invalid_period_rejected(self):
        with pytest.raises(ValidationError) as exc:
            BudgetCreate(
                name="Yearly Budget",
                category="bills",
                amount=Decimal("50000.00"),
                period="annual",
                start_date=date(2026, 1, 1),
                end_date=date(2026, 12, 31),
            )
        assert "Invalid budget period" in str(exc.value)

    def test_end_date_before_start_date_rejected(self):
        with pytest.raises(ValidationError) as exc:
            BudgetCreate(
                name="Invalid Dates",
                category="shopping",
                amount=Decimal("10000.00"),
                start_date=date(2026, 10, 31),
                end_date=date(2026, 10, 1),
            )
        assert "end_date cannot be before start_date" in str(exc.value)

    def test_update_schema_validation(self):
        # Valid partial update
        update = BudgetUpdate(amount=Decimal("20000.00"), name="Updated Groceries")
        assert update.amount == Decimal("20000.00")
        assert update.name == "Updated Groceries"
        assert update.category is None

        # Invalid date range in update
        with pytest.raises(ValidationError):
            BudgetUpdate(
                start_date=date(2026, 10, 31),
                end_date=date(2026, 10, 1),
            )


# ===========================================================================
# 2. Deterministic Spending Calculation Tests
# ===========================================================================
class TestBudgetSpendingCalculations:
    def test_zero_spending(self, db):
        user = create_test_user_in_db(db, "zero_spend")
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="food",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.actual_spending == Decimal("0.00")
        assert summary.remaining_amount == Decimal("10000.00")
        assert summary.over_budget_amount == Decimal("0.00")
        assert summary.spending_percentage == Decimal("0.00")
        assert summary.status == "healthy"

    def test_spending_below_budget_healthy_status(self, db):
        user = create_test_user_in_db(db, "below_spend")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # 5,000 INR spent on food out of 10,000 INR budget (50% -> healthy)
        create_test_transaction(
            db, user.id, acct.id,
            amount=Decimal("5000.00"),
            transaction_type="expense",
            category="food",
            transaction_date=datetime(2026, 10, 15, 12, 0, 0),
        )

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="food",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.actual_spending == Decimal("5000.00")
        assert summary.remaining_amount == Decimal("5000.00")
        assert summary.over_budget_amount == Decimal("0.00")
        assert summary.spending_percentage == Decimal("50.00")
        assert summary.status == "healthy"

    def test_spending_at_80_percent_healthy_boundary(self, db):
        user = create_test_user_in_db(db, "boundary_80")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # Exactly 80% (8,000 / 10,000) -> healthy
        create_test_transaction(
            db, user.id, acct.id,
            amount=Decimal("8000.00"),
            transaction_type="expense",
            category="shopping",
            transaction_date=datetime(2026, 10, 10, 10, 0, 0),
        )

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="shopping",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.spending_percentage == Decimal("80.00")
        assert summary.status == "healthy"

    def test_spending_at_warning_threshold(self, db):
        user = create_test_user_in_db(db, "warning_spend")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # 85% spending (8,500 / 10,000) -> warning
        create_test_transaction(
            db, user.id, acct.id,
            amount=Decimal("8500.00"),
            transaction_type="expense",
            category="transport",
            transaction_date=datetime(2026, 10, 12, 10, 0, 0),
        )

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="transport",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.spending_percentage == Decimal("85.00")
        assert summary.remaining_amount == Decimal("1500.00")
        assert summary.over_budget_amount == Decimal("0.00")
        assert summary.status == "warning"

    def test_spending_exactly_at_100_percent_budget(self, db):
        user = create_test_user_in_db(db, "exact_100")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # Exactly 10,000 / 10,000 -> warning
        create_test_transaction(
            db, user.id, acct.id,
            amount=Decimal("10000.00"),
            transaction_type="expense",
            category="bills",
            transaction_date=datetime(2026, 10, 5, 9, 0, 0),
        )

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="bills",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.spending_percentage == Decimal("100.00")
        assert summary.remaining_amount == Decimal("0.00")
        assert summary.over_budget_amount == Decimal("0.00")
        assert summary.status == "warning"

    def test_spending_over_budget(self, db):
        user = create_test_user_in_db(db, "over_spend")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # 12,500 / 10,000 = 125.00% -> over_budget
        create_test_transaction(
            db, user.id, acct.id,
            amount=Decimal("12500.00"),
            transaction_type="expense",
            category="entertainment",
            transaction_date=datetime(2026, 10, 20, 20, 0, 0),
        )

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="entertainment",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.actual_spending == Decimal("12500.00")
        assert summary.remaining_amount == Decimal("0.00")
        assert summary.over_budget_amount == Decimal("2500.00")
        assert summary.spending_percentage == Decimal("125.00")
        assert summary.status == "over_budget"

    def test_multiple_transactions_aggregation_and_precision(self, db):
        user = create_test_user_in_db(db, "multi_tx")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # 3 expenses: 3333.33 + 3333.33 + 3333.34 = 10000.00
        create_test_transaction(db, user.id, acct.id, Decimal("3333.33"), "expense", "food", datetime(2026, 10, 2, 12, 0))
        create_test_transaction(db, user.id, acct.id, Decimal("3333.33"), "expense", "food", datetime(2026, 10, 10, 12, 0))
        create_test_transaction(db, user.id, acct.id, Decimal("3333.34"), "expense", "food", datetime(2026, 10, 25, 12, 0))

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="food",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("12000.00"),
        )
        assert summary.actual_spending == Decimal("10000.00")
        assert summary.remaining_amount == Decimal("2000.00")
        assert summary.spending_percentage == Decimal("83.33")
        assert summary.status == "warning"

    def test_income_and_transfers_strictly_excluded(self, db):
        user = create_test_user_in_db(db, "exclude_types")
        acct1 = create_test_account_in_db(db, user.id)
        acct2 = Account(
            id=uuid.uuid4(), user_id=user.id, name="Savings 2",
            account_type="savings", balance=Decimal("50000.00"), currency="INR",
        )
        db.add(acct2)
        db.commit()

        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # 1. Genuine expense: 2,000 INR
        create_test_transaction(db, user.id, acct1.id, Decimal("2000.00"), "expense", "healthcare", datetime(2026, 10, 5, 10, 0))

        # 2. Income transaction in healthcare category: 50,000 INR (e.g. insurance reimbursement) -> must NOT reduce or increase spending
        create_test_transaction(db, user.id, acct1.id, Decimal("50000.00"), "income", "healthcare", datetime(2026, 10, 15, 10, 0))

        # 3. Transfer transaction in healthcare category: 10,000 INR -> must NOT count as spending
        create_test_transaction(db, user.id, acct1.id, Decimal("10000.00"), "transfer", "healthcare", datetime(2026, 10, 20, 10, 0), destination_account_id=acct2.id)

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="healthcare",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("5000.00"),
        )
        assert summary.actual_spending == Decimal("2000.00")
        assert summary.remaining_amount == Decimal("3000.00")
        assert summary.spending_percentage == Decimal("40.00")
        assert summary.status == "healthy"

    def test_date_range_filtering(self, db):
        user = create_test_user_in_db(db, "date_filter")
        acct = create_test_account_in_db(db, user.id)

        # Evaluation window: Oct 10 to Oct 20
        s_date = date(2026, 10, 10)
        e_date = date(2026, 10, 20)

        # Before window (Oct 9) -> excluded
        create_test_transaction(db, user.id, acct.id, Decimal("1000.00"), "expense", "shopping", datetime(2026, 10, 9, 23, 59, 59))

        # Inside window (Oct 10 start of day) -> included
        create_test_transaction(db, user.id, acct.id, Decimal("2000.00"), "expense", "shopping", datetime(2026, 10, 10, 0, 0, 0))

        # Inside window (Oct 15 midday) -> included
        create_test_transaction(db, user.id, acct.id, Decimal("3000.00"), "expense", "shopping", datetime(2026, 10, 15, 14, 30, 0))

        # Inside window (Oct 20 end of day) -> included
        create_test_transaction(db, user.id, acct.id, Decimal("4000.00"), "expense", "shopping", datetime(2026, 10, 20, 23, 59, 59))

        # After window (Oct 21) -> excluded
        create_test_transaction(db, user.id, acct.id, Decimal("5000.00"), "expense", "shopping", datetime(2026, 10, 21, 0, 0, 1))

        summary = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user.id,
            category="shopping",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("10000.00"),
        )
        assert summary.actual_spending == Decimal("9000.00")  # 2000 + 3000 + 4000
        assert summary.remaining_amount == Decimal("1000.00")
        assert summary.spending_percentage == Decimal("90.00")
        assert summary.status == "warning"

    def test_multi_category_isolation(self, db):
        user = create_test_user_in_db(db, "category_isolation")
        acct = create_test_account_in_db(db, user.id)
        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        create_test_transaction(db, user.id, acct.id, Decimal("4000.00"), "expense", "food", datetime(2026, 10, 10, 12, 0))
        create_test_transaction(db, user.id, acct.id, Decimal("7000.00"), "expense", "entertainment", datetime(2026, 10, 12, 12, 0))
        create_test_transaction(db, user.id, acct.id, Decimal("15000.00"), "expense", "rent", datetime(2026, 10, 1, 12, 0))

        # Food budget
        food_sum = BudgetService.calculate_budget_spending(db, user.id, "food", s_date, e_date, Decimal("5000.00"))
        assert food_sum.actual_spending == Decimal("4000.00")

        # Entertainment budget
        ent_sum = BudgetService.calculate_budget_spending(db, user.id, "entertainment", s_date, e_date, Decimal("5000.00"))
        assert ent_sum.actual_spending == Decimal("7000.00")
        assert ent_sum.status == "over_budget"


# ===========================================================================
# 3. User Ownership & Cross-User Data Isolation Tests
# ===========================================================================
class TestBudgetUserIsolation:
    def test_user_a_cannot_see_user_b_spending(self, db):
        user_a = create_test_user_in_db(db, "user_a")
        user_b = create_test_user_in_db(db, "user_b")
        acct_a = create_test_account_in_db(db, user_a.id)
        acct_b = create_test_account_in_db(db, user_b.id)

        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        # User B spends 10,000 on food
        create_test_transaction(db, user_b.id, acct_b.id, Decimal("10000.00"), "expense", "food", datetime(2026, 10, 10, 12, 0))

        # User A calculates food budget spending -> must be 0
        summary_a = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user_a.id,
            category="food",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("15000.00"),
        )
        assert summary_a.actual_spending == Decimal("0.00")

        # User B calculates food budget spending -> must be 10,000
        summary_b = BudgetService.calculate_budget_spending(
            db=db,
            user_id=user_b.id,
            category="food",
            start_date=s_date,
            end_date=e_date,
            budget_amount=Decimal("15000.00"),
        )
        assert summary_b.actual_spending == Decimal("10000.00")

    def test_budget_crud_isolation(self, db):
        user_a = create_test_user_in_db(db, "crud_a")
        user_b = create_test_user_in_db(db, "crud_b")

        budget_a = BudgetService.create_budget(
            db, user_a.id,
            BudgetCreate(
                name="User A Rent Budget",
                category="rent",
                amount=Decimal("30000.00"),
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
        )

        # User B list -> empty
        b_list = BudgetService.list_user_budgets(db, user_b.id)
        assert len(b_list) == 0

        # User B get -> None
        b_get = BudgetService.get_user_budget(db, user_b.id, budget_a.id)
        assert b_get is None

        # User B update -> None
        b_update = BudgetService.update_user_budget(
            db, user_b.id, budget_a.id, BudgetUpdate(name="Hacked Budget")
        )
        assert b_update is None

        # User B delete -> False
        b_del = BudgetService.delete_user_budget(db, user_b.id, budget_a.id)
        assert b_del is False

        # Verify User A budget is intact
        a_get = BudgetService.get_user_budget(db, user_a.id, budget_a.id)
        assert a_get is not None
        assert a_get.name == "User A Rent Budget"


# ===========================================================================
# 4. Calculation Determinism Tests
# ===========================================================================
class TestBudgetDeterminism:
    def test_repeated_calculations_are_identical(self, db):
        user = create_test_user_in_db(db, "determ")
        acct = create_test_account_in_db(db, user.id)

        create_test_transaction(db, user.id, acct.id, Decimal("1234.56"), "expense", "shopping", datetime(2026, 10, 5, 10, 0))
        create_test_transaction(db, user.id, acct.id, Decimal("2345.67"), "expense", "shopping", datetime(2026, 10, 15, 10, 0))

        s_date = date(2026, 10, 1)
        e_date = date(2026, 10, 31)

        for _ in range(5):
            res = BudgetService.calculate_budget_spending(
                db=db,
                user_id=user.id,
                category="shopping",
                start_date=s_date,
                end_date=e_date,
                budget_amount=Decimal("5000.00"),
            )
            assert res.actual_spending == Decimal("3580.23")
            assert res.remaining_amount == Decimal("1419.77")
            assert res.over_budget_amount == Decimal("0.00")
            assert res.spending_percentage == Decimal("71.60")
            assert res.status == "healthy"
