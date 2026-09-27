import io
import zipfile
import uuid
from datetime import datetime, date, timezone
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.financial_goal import FinancialGoal
from app.models.loan import Loan
from app.models.recurring_bill import RecurringBill
from app.models.audit_log import AuditLog
from app.core.security import create_access_token


@pytest.fixture
def auth_headers(test_user: User):
    token = create_access_token(subject=test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def populated_user_data(db: Session, test_user: User):
    """Populate financial ledger records for test_user."""
    acc = Account(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Salary Checking",
        account_type="savings",
        balance=Decimal("50000.00"),
        currency="INR",
    )
    db.add(acc)
    db.commit()

    tx = Transaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        amount=Decimal("1500.00"),
        transaction_type="expense",
        category="food",
        description="Grocery Store",
        transaction_date=datetime(2026, 9, 20, 14, 0, 0, tzinfo=timezone.utc),
    )
    b = Budget(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Food Budget",
        category="food",
        amount=Decimal("10000.00"),
        period="monthly",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
    )
    g = FinancialGoal(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Emergency Fund",
        goal_type="emergency_fund",
        target_amount=Decimal("100000.00"),
        current_amount=Decimal("25000.00"),
        target_date=date(2027, 12, 31),
    )
    l = Loan(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Car Loan",
        principal_amount=Decimal("600000.00"),
        outstanding_principal=Decimal("450000.00"),
        interest_rate=Decimal("9.20"),
        tenure_months=60,
        monthly_emi=Decimal("12500.00"),
        start_date=date(2025, 1, 1),
    )
    rb = RecurringBill(
        id=uuid.uuid4(),
        user_id=test_user.id,
        account_id=acc.id,
        name="Netflix Subscription",
        category="bills",
        amount=Decimal("649.00"),
        frequency="monthly",
        start_date=date(2026, 1, 1),
        next_due_date=date(2026, 10, 1),
        status="active",
    )
    db.add_all([tx, b, g, l, rb])
    db.commit()

    return {
        "account": acc,
        "transaction": tx,
        "budget": b,
        "goal": g,
        "loan": l,
        "recurring_bill": rb,
    }


def test_export_data_empty_ledger_json(client: TestClient, test_user: User, auth_headers):
    """Verify JSON export succeeds on empty dataset without errors."""
    res = client.get("/api/v1/data-management/export?format=json", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["metadata"]["email"] == test_user.email
    assert data["metadata"]["total_records"] == 0
    assert data["accounts"] == []
    assert data["transactions"] == []


def test_export_data_populated_json_and_user_isolation(
    client: TestClient, db: Session, test_user: User, auth_headers, populated_user_data
):
    """Verify complete JSON export contains all records and isolates from other users."""
    # Create another user with their own account
    other_user = User(
        id=uuid.uuid4(),
        email=f"other_{uuid.uuid4().hex[:6]}@example.com",
        full_name="Other Person",
    )
    db.add(other_user)
    db.commit()

    other_acc = Account(
        id=uuid.uuid4(),
        user_id=other_user.id,
        name="Other's Secret Account",
        account_type="savings",
        balance=Decimal("9999999.00"),
        currency="INR",
    )
    db.add(other_acc)
    db.commit()

    res = client.get("/api/v1/data-management/export?format=json", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["metadata"]["total_records"] >= 5
    assert len(data["accounts"]) == 1
    assert data["accounts"][0]["name"] == "Salary Checking"
    assert not any(a["name"] == "Other's Secret Account" for a in data["accounts"])  # Isolated


def test_export_data_csv_zip(client: TestClient, auth_headers, populated_user_data):
    """Verify CSV zip export generates valid archive with all CSV tables."""
    res = client.get("/api/v1/data-management/export?format=csv", headers=auth_headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"

    # Inspect zip contents
    zip_bytes = io.BytesIO(res.content)
    with zipfile.ZipFile(zip_bytes, "r") as zf:
        namelist = zf.namelist()
        assert "accounts.csv" in namelist
        assert "transactions.csv" in namelist
        assert "budgets.csv" in namelist
        assert "goals.csv" in namelist
        assert "loans.csv" in namelist
        assert "recurring_bills.csv" in namelist

        tx_content = zf.read("transactions.csv").decode("utf-8")
        assert "Grocery Store" in tx_content


def test_list_audit_logs_endpoint(client: TestClient, auth_headers):
    """Verify audit logs listing endpoint."""
    # Trigger an action that creates an audit log
    client.get("/api/v1/data-management/export?format=json", headers=auth_headers)

    res = client.get("/api/v1/data-management/audit-logs", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any(log["action"] == "DATA_EXPORTED" for log in data["logs"])


def test_delete_account_invalid_confirmation(client: TestClient, test_user: User, auth_headers):
    """Verify delete account rejects mismatched email or incorrect confirmation text."""
    # Wrong email
    res1 = client.post(
        "/api/v1/data-management/delete-account",
        headers=auth_headers,
        json={"confirm_email": "wrong@example.com", "confirmation_text": "DELETE MY ACCOUNT"},
    )
    assert res1.status_code == 400

    # Wrong text
    res2 = client.post(
        "/api/v1/data-management/delete-account",
        headers=auth_headers,
        json={"confirm_email": test_user.email, "confirmation_text": "DELETE"},
    )
    assert res2.status_code == 422  # Pydantic validation


def test_delete_account_success_and_cascade(
    client: TestClient, db: Session, test_user: User, auth_headers, populated_user_data
):
    """Verify successful account deletion cascades and deletes all related ledger records."""
    res = client.post(
        "/api/v1/data-management/delete-account",
        headers=auth_headers,
        json={
            "confirm_email": test_user.email,
            "confirmation_text": "DELETE MY ACCOUNT",
            "reason": "Moving to another service",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "deleted"

    # Verify user record is gone from DB
    deleted_user = db.query(User).filter(User.id == test_user.id).first()
    assert deleted_user is None

    # Verify cascading records are deleted
    assert db.query(Account).filter(Account.user_id == test_user.id).count() == 0
    assert db.query(Transaction).filter(Transaction.user_id == test_user.id).count() == 0
    assert db.query(Budget).filter(Budget.user_id == test_user.id).count() == 0
    assert db.query(FinancialGoal).filter(FinancialGoal.user_id == test_user.id).count() == 0
    assert db.query(Loan).filter(Loan.user_id == test_user.id).count() == 0
    assert db.query(RecurringBill).filter(RecurringBill.user_id == test_user.id).count() == 0
