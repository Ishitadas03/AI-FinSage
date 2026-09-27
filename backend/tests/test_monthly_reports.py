"""
Tests for Dynamic Monthly Financial Reports (Phase 4).
"""
import pytest
from datetime import datetime, date, timezone
from decimal import Decimal
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.recurring_bill import RecurringBill
from app.services.monthly_report_service import monthly_report_service


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
        email=f"report_test_user_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Report Tester",
        password_hash="fakehash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_monthly_report_empty_state(db, test_user):
    """Verify dynamic monthly report handles empty user ledger honestly without errors."""
    report = monthly_report_service.generate_monthly_report(
        db=db,
        user_id=test_user.id,
        month_str="2026-09",
    )

    assert report.period.month_label == "September 2026"
    assert report.summary.total_income == 0.0
    assert report.summary.total_expenses == 0.0
    assert report.summary.savings_rate == 0.0
    assert report.comparison.has_previous_period is False
    assert len(report.missing_data_notes) > 0


def test_monthly_report_with_transactions_and_comparison(db, test_user):
    """Verify calculations, category breakdowns, period comparisons, and budget audits."""
    acc = Account(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="HDFC Salary",
        account_type="savings",
        balance=Decimal("100000.00"),
        currency="INR",
    )
    db_session = db
    db_session.add(acc)
    db_session.commit()

    # August (Previous Month): Income 80k, Expense 40k
    tx_prev_inc = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        amount=Decimal("80000.00"),
        transaction_type="income",
        category="salary",
        description="August Salary",
        transaction_date=datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
    )
    tx_prev_exp = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        amount=Decimal("40000.00"),
        transaction_type="expense",
        category="rent",
        description="August Rent",
        transaction_date=datetime(2026, 8, 5, 10, 0, 0, tzinfo=timezone.utc),
    )

    # September (Current Month): Income 100k, Expense 60k (Rent 40k, Food 20k)
    tx_curr_inc = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        amount=Decimal("100000.00"),
        transaction_type="income",
        category="salary",
        description="September Salary",
        transaction_date=datetime(2026, 9, 1, 10, 0, 0, tzinfo=timezone.utc),
    )
    tx_curr_exp1 = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        amount=Decimal("40000.00"),
        transaction_type="expense",
        category="rent",
        description="September Rent",
        transaction_date=datetime(2026, 9, 5, 10, 0, 0, tzinfo=timezone.utc),
    )
    tx_curr_exp2 = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        amount=Decimal("20000.00"),
        transaction_type="expense",
        category="food",
        description="Swiggy and Dineout",
        transaction_date=datetime(2026, 9, 15, 12, 0, 0, tzinfo=timezone.utc),
    )
    db_session.add_all([tx_prev_inc, tx_prev_exp, tx_curr_inc, tx_curr_exp1, tx_curr_exp2])
    db_session.commit()

    # Add Budget for food (15,000 limit -> 20,000 spent is overrun)
    b_food = Budget(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Food Budget",
        category="food",
        amount=Decimal("15000.00"),
        period="monthly",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
    )
    # Add recurring bill
    bill = RecurringBill(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        name="Wifi Fiber",
        category="bills",
        amount=Decimal("999.00"),
        frequency="monthly",
        start_date=date(2026, 1, 1),
        next_due_date=date(2026, 9, 28),
        status="active",
    )
    db_session.add_all([b_food, bill])
    db_session.commit()

    # Generate Report
    report = monthly_report_service.generate_monthly_report(
        db=db_session,
        user_id=test_user.id,
        month_str="2026-09",
    )

    # Summary checks
    assert report.summary.total_income == 100000.0
    assert report.summary.total_expenses == 60000.0
    assert report.summary.net_savings == 40000.0
    assert report.summary.savings_rate == 40.0

    # Comparison checks (Income +25%, Expenses +50%)
    assert report.comparison.has_previous_period is True
    assert report.comparison.previous_income == 80000.0
    assert report.comparison.previous_expenses == 40000.0
    assert report.comparison.income_change_pct == 25.0
    assert report.comparison.expense_change_pct == 50.0

    # Category checks
    cat_names = [c.category for c in report.categories]
    assert "rent" in cat_names
    assert "food" in cat_names

    # Top expenses
    assert len(report.top_expenses) == 2
    assert report.top_expenses[0].amount == 40000.0

    # Budget audit checks
    food_audit = next((b for b in report.budget_audit if b.category == "food"), None)
    assert food_audit is not None
    assert food_audit.allocated == 15000.0
    assert food_audit.spent == 20000.0
    assert food_audit.is_overrun is True

    # Upcoming obligations
    assert len(report.upcoming_obligations) >= 1
    assert any(o.name == "Wifi Fiber" for o in report.upcoming_obligations)

    # Executive summary and checklist
    assert "September 2026" in report.executive_summary
    assert len(report.action_checklist) >= 2


def test_monthly_report_api_endpoint(client: TestClient, db, test_user):
    """Verify GET /api/v1/reports/monthly API endpoint."""
    token = create_access_token(subject=test_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/reports/monthly?month=2026-09", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["period"]["month_label"] == "September 2026"
    assert "summary" in data
    assert "comparison" in data
    assert "categories" in data
    assert "budget_audit" in data
    assert "action_checklist" in data
