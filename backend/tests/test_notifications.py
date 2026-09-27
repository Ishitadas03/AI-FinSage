from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User
from app.models.notification import Notification
from app.models.recurring_bill import RecurringBill
from app.schemas.notification import NotificationCreate
from app.services.notification_service import NotificationService
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
        email=f"notif_user_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Notif Tester",
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
        email=f"other_notif_{uuid.uuid4().hex[:8]}@example.com",
        full_name="Other Notif",
        password_hash="fakehash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def client():
    return TestClient(app)


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}


class TestNotificationService:
    def test_create_and_list_notifications(self, db, test_user):
        payload = NotificationCreate(
            title="Security Alert",
            message="New login from Chrome on Windows",
            type="security",
        )
        notif = NotificationService.create_notification(db, test_user.id, payload)
        assert notif.title == "Security Alert"
        assert not notif.is_read

        listed = NotificationService.list_notifications(db, test_user.id)
        assert listed.total >= 1
        assert listed.unread_count >= 1
        assert any(n.id == notif.id for n in listed.items)

    def test_mark_single_as_read(self, db, test_user):
        payload = NotificationCreate(
            title="Goal Milestone",
            message="You reached 50% of your Emergency Fund goal!",
            type="goal",
        )
        notif = NotificationService.create_notification(db, test_user.id, payload)
        assert not notif.is_read

        updated = NotificationService.mark_as_read(db, test_user.id, notif.id)
        assert updated.is_read
        assert updated.read_at is not None

    def test_mark_all_as_read(self, db, test_user):
        for i in range(3):
            NotificationService.create_notification(
                db,
                test_user.id,
                NotificationCreate(
                    title=f"Insight {i+1}",
                    message="You spent less on dining this week.",
                    type="insight",
                ),
            )

        count = NotificationService.mark_all_as_read(db, test_user.id)
        assert count >= 3

        listed = NotificationService.list_notifications(db, test_user.id, is_read=False)
        assert listed.unread_count == 0

    def test_due_bill_alert_generation_and_deduplication(self, db, test_user):
        today = date.today()

        # 1. Overdue bill
        overdue_bill = RecurringBill(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Electricity Bill",
            amount=Decimal("150.00"),
            frequency="monthly",
            start_date=today - timedelta(days=40),
            next_due_date=today - timedelta(days=5),
            status="active",
            reminder_days_before=3,
        )
        # 2. Upcoming bill (due tomorrow)
        upcoming_bill = RecurringBill(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Water Bill",
            amount=Decimal("45.00"),
            frequency="monthly",
            start_date=today - timedelta(days=30),
            next_due_date=today + timedelta(days=1),
            status="active",
            reminder_days_before=3,
        )
        # 3. Far future bill (due in 20 days)
        far_bill = RecurringBill(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Property Tax",
            amount=Decimal("1200.00"),
            frequency="annual",
            start_date=today - timedelta(days=300),
            next_due_date=today + timedelta(days=20),
            status="active",
            reminder_days_before=3,
        )
        db.add_all([overdue_bill, upcoming_bill, far_bill])
        db.commit()

        # Run generator first time
        gen_count_1 = NotificationService.generate_due_bill_notifications(db, test_user.id, reference_date=today)
        assert gen_count_1 == 2  # overdue + upcoming

        # Run generator second time (idempotency check)
        gen_count_2 = NotificationService.generate_due_bill_notifications(db, test_user.id, reference_date=today)
        assert gen_count_2 == 0  # No duplicates created!

        # Check notification contents
        listed = NotificationService.list_notifications(db, test_user.id)
        overdue_notif = next((n for n in listed.items if n.type == "bill_overdue"), None)
        assert overdue_notif is not None
        assert "Electricity Bill" in overdue_notif.title

        upcoming_notif = next((n for n in listed.items if n.type == "bill_upcoming"), None)
        assert upcoming_notif is not None
        assert "Water Bill" in upcoming_notif.title

    def test_user_isolation(self, db, test_user, other_user):
        notif = NotificationService.create_notification(
            db,
            test_user.id,
            NotificationCreate(title="Private Note", message="Secret", type="system"),
        )

        with pytest.raises(HTTPException) as exc:
            NotificationService.mark_as_read(db, other_user.id, notif.id)
        assert exc.value.status_code == 404

        with pytest.raises(HTTPException) as exc:
            NotificationService.delete_notification(db, other_user.id, notif.id)
        assert exc.value.status_code == 404


class TestNotificationsAPI:
    def test_list_and_read_api(self, client, test_user):
        headers = auth_headers(test_user)
        # Create notif
        create_res = client.post(
            "/api/v1/notifications",
            json={"title": "Budget Alert", "message": "Dining budget at 90%", "type": "budget_alert"},
            headers=headers,
        )
        assert create_res.status_code == 201
        notif_id = create_res.json()["id"]

        # List
        list_res = client.get("/api/v1/notifications?auto_generate=false", headers=headers)
        assert list_res.status_code == 200
        assert list_res.json()["unread_count"] >= 1

        # Mark read
        read_res = client.post(f"/api/v1/notifications/{notif_id}/read", headers=headers)
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

        # Mark all read
        all_read_res = client.post("/api/v1/notifications/mark-all-read", headers=headers)
        assert all_read_res.status_code == 200

        # Delete
        del_res = client.delete(f"/api/v1/notifications/{notif_id}", headers=headers)
        assert del_res.status_code == 200
