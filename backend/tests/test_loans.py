from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.models.user import User
from app.models.loan import Loan
from app.schemas.loan import LoanCreate, LoanRead, LoanUpdate
from app.core.database import SessionLocal

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper fixture to register and log in a unique user, returning user data and auth header."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"Loan User {uid} {name_suffix}".strip(),
        "email": f"loan_user_{uid}_{name_suffix.lower()}@example.com",
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


def create_test_user_in_db() -> User:
    """Helper to create and persist a test user in DB for direct model tests."""
    db = SessionLocal()
    uid = uuid.uuid4().hex[:8]
    user = User(
        id=uuid.uuid4(),
        full_name=f"Loan Test User {uid}",
        email=f"loan_direct_{uid}@example.com",
        password_hash="mock_hash_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


# ==========================================
# Model & Schema Unit Tests
# ==========================================

def test_valid_loan_model_creation_and_persistence():
    user = create_test_user_in_db()
    db = SessionLocal()

    loan = Loan(
        id=uuid.uuid4(),
        user_id=user.id,
        name="HDFC Home Loan",
        principal_amount=Decimal("5000000.00"),
        outstanding_principal=Decimal("4200000.50"),
        interest_rate=Decimal("8.5000"),
        tenure_months=240,
        monthly_emi=Decimal("43391.12"),
        start_date=date(2024, 1, 15),
        end_date=date(2044, 1, 15),
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    assert loan.id is not None
    assert loan.user_id == user.id
    assert loan.name == "HDFC Home Loan"
    assert loan.principal_amount == Decimal("5000000.00")
    assert loan.outstanding_principal == Decimal("4200000.50")
    assert loan.interest_rate == Decimal("8.5000")
    assert loan.tenure_months == 240
    assert loan.monthly_emi == Decimal("43391.12")
    assert loan.start_date == date(2024, 1, 15)
    assert loan.end_date == date(2044, 1, 15)
    assert loan.created_at is not None
    assert loan.updated_at is not None
    assert "HDFC Home Loan" in repr(loan)

    # Test user relationship backref
    db_user = db.query(User).filter(User.id == user.id).first()
    assert len(db_user.loans) == 1
    assert db_user.loans[0].id == loan.id

    db.close()


def test_loan_without_end_date():
    user = create_test_user_in_db()
    db = SessionLocal()

    loan = Loan(
        id=uuid.uuid4(),
        user_id=user.id,
        name="Personal Loan Flexible",
        principal_amount=Decimal("100000.00"),
        outstanding_principal=Decimal("100000.00"),
        interest_rate=Decimal("12.0000"),
        tenure_months=36,
        monthly_emi=Decimal("3321.43"),
        start_date=date(2025, 6, 1),
        end_date=None,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    assert loan.end_date is None
    db.close()


def test_loan_model_validation_negative_or_zero_principal():
    with pytest.raises(ValueError, match="principal_amount must be greater than 0"):
        Loan(
            name="Invalid Principal",
            principal_amount=Decimal("0.00"),
            outstanding_principal=Decimal("0.00"),
            interest_rate=Decimal("10.00"),
            tenure_months=12,
            monthly_emi=Decimal("1000.00"),
            start_date=date(2025, 1, 1),
        )

    with pytest.raises(ValueError, match="principal_amount must be greater than 0"):
        Loan(
            name="Negative Principal",
            principal_amount=Decimal("-5000.00"),
            outstanding_principal=Decimal("0.00"),
            interest_rate=Decimal("10.00"),
            tenure_months=12,
            monthly_emi=Decimal("1000.00"),
            start_date=date(2025, 1, 1),
        )


def test_loan_model_validation_negative_outstanding_principal():
    with pytest.raises(ValueError, match="outstanding_principal must be greater than or equal to 0"):
        Loan(
            name="Negative Outstanding",
            principal_amount=Decimal("50000.00"),
            outstanding_principal=Decimal("-10.00"),
            interest_rate=Decimal("10.00"),
            tenure_months=12,
            monthly_emi=Decimal("1000.00"),
            start_date=date(2025, 1, 1),
        )


def test_loan_model_validation_negative_interest_rate():
    with pytest.raises(ValueError, match="interest_rate must be greater than or equal to 0"):
        Loan(
            name="Negative Rate",
            principal_amount=Decimal("50000.00"),
            outstanding_principal=Decimal("50000.00"),
            interest_rate=Decimal("-1.50"),
            tenure_months=12,
            monthly_emi=Decimal("1000.00"),
            start_date=date(2025, 1, 1),
        )


def test_loan_model_validation_invalid_tenure_and_emi():
    with pytest.raises(ValueError, match="tenure_months must be greater than 0"):
        Loan(
            name="Zero Tenure",
            principal_amount=Decimal("50000.00"),
            outstanding_principal=Decimal("50000.00"),
            interest_rate=Decimal("10.00"),
            tenure_months=0,
            monthly_emi=Decimal("1000.00"),
            start_date=date(2025, 1, 1),
        )

    with pytest.raises(ValueError, match="monthly_emi must be greater than 0"):
        Loan(
            name="Zero EMI",
            principal_amount=Decimal("50000.00"),
            outstanding_principal=Decimal("50000.00"),
            interest_rate=Decimal("10.00"),
            tenure_months=12,
            monthly_emi=Decimal("0.00"),
            start_date=date(2025, 1, 1),
        )


def test_loan_schema_validation():
    valid_data = {
        "name": "Auto Loan",
        "principal_amount": "800000.00",
        "outstanding_principal": "650000.00",
        "interest_rate": "9.2500",
        "tenure_months": 60,
        "monthly_emi": "16709.87",
        "start_date": "2024-03-01",
        "end_date": "2029-03-01",
    }
    schema = LoanCreate(**valid_data)
    assert schema.name == "Auto Loan"
    assert schema.principal_amount == Decimal("800000.00")
    assert schema.outstanding_principal == Decimal("650000.00")

    # Outstanding principal > principal amount rejected
    invalid_outstanding = valid_data.copy()
    invalid_outstanding["outstanding_principal"] = "900000.00"
    with pytest.raises(ValidationError, match="outstanding_principal cannot exceed principal_amount"):
        LoanCreate(**invalid_outstanding)

    # End date before start date rejected
    invalid_dates = valid_data.copy()
    invalid_dates["end_date"] = "2023-01-01"
    with pytest.raises(ValidationError, match="end_date cannot be before start_date"):
        LoanCreate(**invalid_dates)

    # Negative values rejected by schema
    invalid_emi = valid_data.copy()
    invalid_emi["monthly_emi"] = "-500.00"
    with pytest.raises(ValidationError):
        LoanCreate(**invalid_emi)


# ==========================================
# Authenticated API CRUD Tests
# ==========================================

def test_authenticated_user_can_create_loan():
    user = register_and_login_user("create_loan")
    payload = {
        "name": "SBI Education Loan",
        "principal_amount": "1500000.00",
        "outstanding_principal": "1250000.00",
        "interest_rate": "8.1500",
        "tenure_months": 84,
        "monthly_emi": "23540.25",
        "start_date": "2024-06-01",
        "end_date": "2031-06-01",
    }
    response = client.post("/api/v1/loans", json=payload, headers=user["headers"])
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "SBI Education Loan"
    assert Decimal(data["principal_amount"]) == Decimal("1500000.00")
    assert Decimal(data["outstanding_principal"]) == Decimal("1250000.00")
    assert Decimal(data["interest_rate"]) == Decimal("8.1500")
    assert data["tenure_months"] == 84
    assert Decimal(data["monthly_emi"]) == Decimal("23540.25")
    assert data["start_date"] == "2024-06-01"
    assert data["end_date"] == "2031-06-01"
    assert data["user_id"] == user["user"]["id"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_unauthenticated_create_loan_rejected():
    payload = {
        "name": "Unauthorized Loan",
        "principal_amount": "50000.00",
        "outstanding_principal": "50000.00",
        "interest_rate": "10.0000",
        "tenure_months": 12,
        "monthly_emi": "4500.00",
        "start_date": "2025-01-01",
    }
    response = client.post("/api/v1/loans", json=payload)
    assert response.status_code == 401


def test_user_id_automatically_assigned_from_auth_user():
    user = register_and_login_user("auto_userid")
    fake_user_id = str(uuid.uuid4())
    payload = {
        "name": "Car Loan",
        "principal_amount": "600000.00",
        "outstanding_principal": "600000.00",
        "interest_rate": "9.0000",
        "tenure_months": 48,
        "monthly_emi": "14930.00",
        "start_date": "2025-02-01",
        "user_id": fake_user_id,  # Should be ignored/not accepted
    }
    response = client.post("/api/v1/loans", json=payload, headers=user["headers"])
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user["user"]["id"]
    assert data["user_id"] != fake_user_id


def test_authenticated_user_can_list_their_loans_and_isolation():
    user_a = register_and_login_user("list_a")
    user_b = register_and_login_user("list_b")

    # User A creates 2 loans
    client.post("/api/v1/loans", json={
        "name": "User A Loan 1",
        "principal_amount": "100000.00",
        "outstanding_principal": "100000.00",
        "interest_rate": "11.0000",
        "tenure_months": 24,
        "monthly_emi": "4660.00",
        "start_date": "2025-01-01",
    }, headers=user_a["headers"])

    client.post("/api/v1/loans", json={
        "name": "User A Loan 2",
        "principal_amount": "200000.00",
        "outstanding_principal": "180000.00",
        "interest_rate": "10.5000",
        "tenure_months": 36,
        "monthly_emi": "6500.00",
        "start_date": "2025-01-01",
    }, headers=user_a["headers"])

    # User B creates 1 loan
    client.post("/api/v1/loans", json={
        "name": "User B Loan 1",
        "principal_amount": "500000.00",
        "outstanding_principal": "450000.00",
        "interest_rate": "9.5000",
        "tenure_months": 60,
        "monthly_emi": "10500.00",
        "start_date": "2025-01-01",
    }, headers=user_b["headers"])

    # User A list
    res_a = client.get("/api/v1/loans", headers=user_a["headers"])
    assert res_a.status_code == 200
    loans_a = res_a.json()
    assert len(loans_a) == 2
    for l in loans_a:
        assert l["user_id"] == user_a["user"]["id"]
        assert "User A" in l["name"]

    # User B list
    res_b = client.get("/api/v1/loans", headers=user_b["headers"])
    assert res_b.status_code == 200
    loans_b = res_b.json()
    assert len(loans_b) == 1
    assert loans_b[0]["user_id"] == user_b["user"]["id"]
    assert loans_b[0]["name"] == "User B Loan 1"


def test_authenticated_user_can_get_their_loan():
    user = register_and_login_user("get_loan")
    create_res = client.post("/api/v1/loans", json={
        "name": "Bike Loan",
        "principal_amount": "120000.00",
        "outstanding_principal": "95000.00",
        "interest_rate": "11.5000",
        "tenure_months": 24,
        "monthly_emi": "5620.00",
        "start_date": "2024-08-01",
    }, headers=user["headers"])
    loan_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/loans/{loan_id}", headers=user["headers"])
    assert get_res.status_code == 200
    assert get_res.json()["id"] == loan_id
    assert get_res.json()["name"] == "Bike Loan"


def test_nonexistent_loan_returns_correct_404():
    user = register_and_login_user("nonexistent")
    random_id = str(uuid.uuid4())
    get_res = client.get(f"/api/v1/loans/{random_id}", headers=user["headers"])
    assert get_res.status_code == 404
    assert "not found" in get_res.json()["detail"].lower()


def test_cross_user_loan_access_isolation():
    user_a = register_and_login_user("cross_a")
    user_b = register_and_login_user("cross_b")

    # User A creates a loan
    create_res = client.post("/api/v1/loans", json={
        "name": "User A Private Loan",
        "principal_amount": "300000.00",
        "outstanding_principal": "250000.00",
        "interest_rate": "10.0000",
        "tenure_months": 36,
        "monthly_emi": "9680.00",
        "start_date": "2025-01-01",
    }, headers=user_a["headers"])
    loan_a_id = create_res.json()["id"]

    # User B attempts to GET User A's loan -> 404
    get_res = client.get(f"/api/v1/loans/{loan_a_id}", headers=user_b["headers"])
    assert get_res.status_code == 404

    # User B attempts to PATCH User A's loan -> 404
    patch_res = client.patch(
        f"/api/v1/loans/{loan_a_id}",
        json={"name": "Hacked Loan"},
        headers=user_b["headers"],
    )
    assert patch_res.status_code == 404

    # User B attempts to DELETE User A's loan -> 404
    del_res = client.delete(f"/api/v1/loans/{loan_a_id}", headers=user_b["headers"])
    assert del_res.status_code == 404

    # Verify User A's loan is intact
    verify_res = client.get(f"/api/v1/loans/{loan_a_id}", headers=user_a["headers"])
    assert verify_res.status_code == 200
    assert verify_res.json()["name"] == "User A Private Loan"


def test_authenticated_user_can_update_their_loan_with_validations():
    user = register_and_login_user("update_loan")
    create_res = client.post("/api/v1/loans", json={
        "name": "Old Loan Name",
        "principal_amount": "500000.00",
        "outstanding_principal": "400000.00",
        "interest_rate": "9.5000",
        "tenure_months": 48,
        "monthly_emi": "12560.00",
        "start_date": "2024-01-01",
        "end_date": "2028-01-01",
    }, headers=user["headers"])
    loan_id = create_res.json()["id"]

    # 1. Valid update
    update_res = client.patch(
        f"/api/v1/loans/{loan_id}",
        json={
            "name": "Updated Renovation Loan",
            "outstanding_principal": "350000.00",
            "interest_rate": "9.0000",
        },
        headers=user["headers"],
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Renovation Loan"
    assert Decimal(update_res.json()["outstanding_principal"]) == Decimal("350000.00")
    assert Decimal(update_res.json()["interest_rate"]) == Decimal("9.0000")

    # 2. Reject outstanding_principal > principal_amount
    invalid_out = client.patch(
        f"/api/v1/loans/{loan_id}",
        json={"outstanding_principal": "600000.00"},
        headers=user["headers"],
    )
    assert invalid_out.status_code in [400, 422]

    # 3. Reject negative principal amount
    invalid_princ = client.patch(
        f"/api/v1/loans/{loan_id}",
        json={"principal_amount": "-1000.00"},
        headers=user["headers"],
    )
    assert invalid_princ.status_code in [400, 422]

    # 4. Reject end_date before start_date
    invalid_dates = client.patch(
        f"/api/v1/loans/{loan_id}",
        json={"end_date": "2023-01-01"},
        headers=user["headers"],
    )
    assert invalid_dates.status_code in [400, 422]


def test_authenticated_user_can_delete_their_loan():
    user = register_and_login_user("delete_loan")
    create_res = client.post("/api/v1/loans", json={
        "name": "Temporary Loan",
        "principal_amount": "50000.00",
        "outstanding_principal": "50000.00",
        "interest_rate": "12.0000",
        "tenure_months": 6,
        "monthly_emi": "8600.00",
        "start_date": "2025-01-01",
    }, headers=user["headers"])
    loan_id = create_res.json()["id"]

    # Delete loan
    del_res = client.delete(f"/api/v1/loans/{loan_id}", headers=user["headers"])
    assert del_res.status_code == 200
    assert "deleted" in del_res.json()["message"].lower()

    # Verify 404 after deletion
    get_res = client.get(f"/api/v1/loans/{loan_id}", headers=user["headers"])
    assert get_res.status_code == 404
