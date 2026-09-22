from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.loan import Loan
from app.schemas.loan import LoanCreate, LoanRead, LoanUpdate
from app.core.database import SessionLocal


def create_test_user_in_db() -> User:
    """Helper to create and persist a test user in DB for FK association."""
    db = SessionLocal()
    uid = uuid.uuid4().hex[:8]
    user = User(
        id=uuid.uuid4(),
        full_name=f"Loan Test User {uid}",
        email=f"loan_user_{uid}@example.com",
        password_hash="mock_hash_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


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
    # 1. Valid LoanCreate
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

    # 2. Outstanding principal > principal amount rejected
    invalid_outstanding = valid_data.copy()
    invalid_outstanding["outstanding_principal"] = "900000.00"
    with pytest.raises(ValidationError, match="outstanding_principal cannot exceed principal_amount"):
        LoanCreate(**invalid_outstanding)

    # 3. End date before start date rejected
    invalid_dates = valid_data.copy()
    invalid_dates["end_date"] = "2023-01-01"
    with pytest.raises(ValidationError, match="end_date cannot be before start_date"):
        LoanCreate(**invalid_dates)

    # 4. Negative values rejected by schema
    invalid_emi = valid_data.copy()
    invalid_emi["monthly_emi"] = "-500.00"
    with pytest.raises(ValidationError):
        LoanCreate(**invalid_emi)
