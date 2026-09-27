from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.recurring_bill import RecurringBill
from app.models.notification import Notification
from app.schemas.recurring_bill import (
    RecurringBillCreate,
    RecurringBillUpdate,
    RecurringBillPostPaymentRequest,
)
from app.services.recurring_bill_service import (
    RecurringBillService,
    advance_recurrence_date,
    calculate_initial_next_due_date,
    calculate_monthly_equivalent,
)
from app.core.database import SessionLocal
from app.core.security import create_access_token


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
        email=f"recbill_user_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Bill Tester",
        password_hash="fakehash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def other_user(db):
    user = User(
        id=uuid.uuid4(),
        email=f"other_user_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Other User",
        password_hash="fakehash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_account(db, test_user):
    account = Account(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Main Checking",
        account_type="checking",
        balance=Decimal("5000.00"),
        currency="USD",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@pytest.fixture
def client():
    return TestClient(app)


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}


class TestRecurrenceDateCalculations:
    def test_daily_recurrence(self):
        d = date(2026, 1, 15)
        nxt = advance_recurrence_date(d, "daily")
        assert nxt == date(2026, 1, 16)

    def test_weekly_recurrence(self):
        d = date(2026, 1, 15)
        nxt = advance_recurrence_date(d, "weekly")
        assert nxt == date(2026, 1, 22)

    def test_biweekly_recurrence(self):
        d = date(2026, 1, 15)
        nxt = advance_recurrence_date(d, "biweekly")
        assert nxt == date(2026, 1, 29)

    def test_monthly_month_end_clamping(self):
        # Jan 31 -> Feb 28 in non-leap year (2025)
        d_jan31 = date(2025, 1, 31)
        nxt_feb = advance_recurrence_date(d_jan31, "monthly", anchor_day=31)
        assert nxt_feb == date(2025, 2, 28)

        # Feb 28 -> Mar 31 (anchored to 31st)
        nxt_mar = advance_recurrence_date(nxt_feb, "monthly", anchor_day=31)
        assert nxt_mar == date(2025, 3, 31)

        # Mar 31 -> Apr 30
        nxt_apr = advance_recurrence_date(nxt_mar, "monthly", anchor_day=31)
        assert nxt_apr == date(2025, 4, 30)

    def test_monthly_leap_year(self):
        # Jan 31 -> Feb 29 in leap year (2024)
        d_jan31 = date(2024, 1, 31)
        nxt_feb = advance_recurrence_date(d_jan31, "monthly", anchor_day=31)
        assert nxt_feb == date(2024, 2, 29)

    def test_quarterly_recurrence(self):
        d = date(2026, 1, 15)
        nxt = advance_recurrence_date(d, "quarterly")
        assert nxt == date(2026, 4, 15)

    def test_semi_annual_recurrence(self):
        d = date(2026, 1, 15)
        nxt = advance_recurrence_date(d, "semi_annual")
        assert nxt == date(2026, 7, 15)

    def test_annual_recurrence(self):
        d = date(2026, 5, 20)
        nxt = advance_recurrence_date(d, "annual")
        assert nxt == date(2027, 5, 20)

    def test_calculate_initial_next_due_date_past_start(self):
        start = date(2026, 1, 1)
        today = date(2026, 3, 10)
        due = calculate_initial_next_due_date(start, "monthly", today=today)
        assert due == date(2026, 4, 1)

    def test_calculate_initial_next_due_date_future_start(self):
        start = date(2026, 12, 1)
        today = date(2026, 3, 10)
        due = calculate_initial_next_due_date(start, "monthly", today=today)
        assert due == date(2026, 12, 1)


class TestRecurringBillService:
    def test_create_and_get_bill(self, db, test_user, test_account):
        payload = RecurringBillCreate(
            name="Internet Fiber",
            merchant="Acme Telecom",
            category="utilities",
            amount=Decimal("79.99"),
            frequency="monthly",
            start_date=date.today(),
            account_id=test_account.id,
            reminder_days_before=5,
        )
        bill = RecurringBillService.create_recurring_bill(db, test_user.id, payload)
        assert bill.name == "Internet Fiber"
        assert bill.amount == Decimal("79.99")
        assert bill.status == "active"
        assert bill.account_id == test_account.id

        fetched = RecurringBillService.get_recurring_bill(db, test_user.id, bill.id)
        assert fetched.id == bill.id

    def test_create_bill_invalid_account(self, db, test_user, other_user):
        other_account = Account(
            id=uuid.uuid4(),
            user_id=other_user.id,
            name="Other Acct",
            account_type="checking",
            balance=Decimal("100"),
        )
        db.add(other_account)
        db.commit()

        payload = RecurringBillCreate(
            name="Fake Bill",
            amount=Decimal("50.00"),
            frequency="monthly",
            start_date=date.today(),
            account_id=other_account.id,
        )
        with pytest.raises(HTTPException) as exc:
            RecurringBillService.create_recurring_bill(db, test_user.id, payload)
        assert exc.value.status_code == 400

    def test_user_isolation(self, db, test_user, other_user):
        payload = RecurringBillCreate(
            name="Private Subscription",
            amount=Decimal("15.00"),
            frequency="monthly",
            start_date=date.today(),
        )
        bill = RecurringBillService.create_recurring_bill(db, test_user.id, payload)

        with pytest.raises(HTTPException) as exc:
            RecurringBillService.get_recurring_bill(db, other_user.id, bill.id)
        assert exc.value.status_code == 404

    def test_pause_and_resume(self, db, test_user):
        payload = RecurringBillCreate(
            name="Gym Membership",
            amount=Decimal("45.00"),
            frequency="monthly",
            start_date=date.today(),
        )
        bill = RecurringBillService.create_recurring_bill(db, test_user.id, payload)

        paused = RecurringBillService.toggle_status(db, test_user.id, bill.id, "paused")
        assert paused.status == "paused"

        resumed = RecurringBillService.toggle_status(db, test_user.id, bill.id, "active")
        assert resumed.status == "active"

    def test_post_bill_payment_creates_transaction_and_advances_due(self, db, test_user, test_account):
        start = date(2026, 4, 1)
        payload = RecurringBillCreate(
            name="Cloud Storage",
            merchant="CloudCorp",
            category="subscriptions",
            amount=Decimal("9.99"),
            frequency="monthly",
            start_date=start,
            account_id=test_account.id,
        )
        bill = RecurringBillService.create_recurring_bill(db, test_user.id, payload)
        original_due = bill.next_due_date

        post_req = RecurringBillPostPaymentRequest(
            payment_date=original_due,
            notes="April Cloud Storage invoice",
        )
        transaction, updated_bill = RecurringBillService.post_bill_payment(
            db, test_user.id, bill.id, post_req
        )

        assert transaction.amount == Decimal("9.99")
        assert transaction.merchant == "CloudCorp"
        assert transaction.category == "subscriptions"
        assert transaction.account_id == test_account.id
        assert updated_bill.last_posted_date == original_due
        assert updated_bill.next_due_date > original_due

        # Verify bill_paid notification was generated
        notif = db.query(Notification).filter(
            Notification.user_id == test_user.id,
            Notification.type == "bill_paid",
        ).first()
        assert notif is not None
        assert "Cloud Storage" in notif.title

    def test_delete_recurring_bill_preserves_transactions(self, db, test_user, test_account):
        payload = RecurringBillCreate(
            name="Streaming Service",
            amount=Decimal("12.99"),
            frequency="monthly",
            start_date=date(2026, 1, 1),
            account_id=test_account.id,
        )
        bill = RecurringBillService.create_recurring_bill(db, test_user.id, payload)

        # Post payment
        tx, _ = RecurringBillService.post_bill_payment(
            db, test_user.id, bill.id, RecurringBillPostPaymentRequest()
        )
        tx_id = tx.id

        # Delete recurring bill rule
        RecurringBillService.delete_recurring_bill(db, test_user.id, bill.id)

        # Ensure bill is deleted
        with pytest.raises(HTTPException):
            RecurringBillService.get_recurring_bill(db, test_user.id, bill.id)

        # Ensure historical transaction STILL exists
        preserved_tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
        assert preserved_tx is not None
        assert preserved_tx.amount == Decimal("12.99")


class TestRecurringBillsAPI:
    def test_create_and_list_api(self, client, test_user, test_account):
        headers = auth_headers(test_user)
        create_res = client.post(
            "/api/v1/recurring-bills",
            json={
                "name": "Electric Utility",
                "merchant": "Power Grid",
                "category": "utilities",
                "amount": 125.50,
                "frequency": "monthly",
                "start_date": "2026-05-01",
                "account_id": str(test_account.id),
                "reminder_days_before": 3,
            },
            headers=headers,
        )
        assert create_res.status_code == 201
        data = create_res.json()
        assert data["name"] == "Electric Utility"
        assert data["account_name"] == "Main Checking"

        list_res = client.get("/api/v1/recurring-bills", headers=headers)
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert list_data["active_count"] >= 1
        assert float(list_data["monthly_committed_total"]) >= 125.50

    def test_post_payment_api(self, client, test_user, test_account):
        headers = auth_headers(test_user)
        create_res = client.post(
            "/api/v1/recurring-bills",
            json={
                "name": "Spotify Family",
                "amount": 16.99,
                "frequency": "monthly",
                "start_date": "2026-01-01",
                "account_id": str(test_account.id),
            },
            headers=headers,
        )
        bill_id = create_res.json()["id"]

        pay_res = client.post(
            f"/api/v1/recurring-bills/{bill_id}/post-payment",
            json={"notes": "Manual settlement"},
            headers=headers,
        )
        assert pay_res.status_code == 200
        pay_data = pay_res.json()
        assert "transaction" in pay_data
        assert pay_data["bill"]["last_posted_date"] is not None

    def test_pause_and_resume_api(self, client, test_user):
        headers = auth_headers(test_user)
        create_res = client.post(
            "/api/v1/recurring-bills",
            json={
                "name": "Newspaper Subscription",
                "amount": 5.00,
                "frequency": "weekly",
                "start_date": "2026-01-01",
            },
            headers=headers,
        )
        bill_id = create_res.json()["id"]

        pause_res = client.post(f"/api/v1/recurring-bills/{bill_id}/pause", headers=headers)
        assert pause_res.status_code == 200
        assert pause_res.json()["status"] == "paused"

        resume_res = client.post(f"/api/v1/recurring-bills/{bill_id}/resume", headers=headers)
        assert resume_res.status_code == 200
        assert resume_res.json()["status"] == "active"
