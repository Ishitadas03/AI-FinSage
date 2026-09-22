from datetime import datetime, timezone
from decimal import Decimal
import uuid
import pytest
from app.core.database import SessionLocal
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.services.credit_utilization_service import CreditUtilizationService
from app.services.account_service import AccountService


def create_test_user_in_db() -> User:
    """Helper to create and persist a test user in DB."""
    db = SessionLocal()
    uid = uuid.uuid4().hex[:8]
    user = User(
        id=uuid.uuid4(),
        full_name=f"Utilization User {uid}",
        email=f"util_user_{uid}@example.com",
        password_hash="mock_hash_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def create_account_in_db(
    user_id: uuid.UUID,
    name: str,
    account_type: str,
    balance: Decimal = Decimal("0.00"),
    credit_limit: Decimal = None,
) -> Account:
    """Helper to create and persist an account in DB."""
    db = SessionLocal()
    acc = Account(
        id=uuid.uuid4(),
        user_id=user_id,
        name=name,
        account_type=account_type,
        balance=balance,
        credit_limit=credit_limit,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    db.close()
    return acc


def create_transaction_in_db(
    user_id: uuid.UUID,
    account_id: uuid.UUID,
    amount: Decimal,
    transaction_type: str,
    category: str = "shopping",
) -> Transaction:
    """Helper to create and persist a transaction in DB."""
    db = SessionLocal()
    tx = Transaction(
        id=uuid.uuid4(),
        user_id=user_id,
        account_id=account_id,
        amount=amount,
        transaction_type=transaction_type,
        category=category,
        transaction_date=datetime.now(timezone.utc),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    db.close()
    return tx


# ==========================================
# Unit & Calculation Tests
# ==========================================

def test_credit_card_valid_limit_and_zero_balance():
    user = create_test_user_in_db()
    acc = create_account_in_db(
        user_id=user.id,
        name="Zero Balance Card",
        account_type="credit_card",
        balance=Decimal("0.00"),
        credit_limit=Decimal("100000.00"),
    )

    db = SessionLocal()
    result = CreditUtilizationService.get_user_credit_utilization(db, user.id)
    db.close()

    assert len(result.cards) == 1
    card = result.cards[0]
    assert card.account_id == acc.id
    assert card.outstanding_balance == Decimal("0.00")
    assert card.credit_limit == Decimal("100000.00")
    assert card.utilization_percentage == Decimal("0.00")
    assert card.status == "healthy"

    assert result.aggregate.total_outstanding == Decimal("0.00")
    assert result.aggregate.total_credit_limit == Decimal("100000.00")
    assert result.aggregate.utilization_percentage == Decimal("0.00")
    assert result.aggregate.status == "healthy"


def test_credit_card_valid_outstanding_balance_and_dynamic_ledger():
    user = create_test_user_in_db()
    acc = create_account_in_db(
        user_id=user.id,
        name="HDFC Regalia",
        account_type="credit_card",
        balance=Decimal("0.00"),
        credit_limit=Decimal("100000.00"),
    )

    # Post an expense transaction of 25,000 on the credit card
    create_transaction_in_db(
        user_id=user.id,
        account_id=acc.id,
        amount=Decimal("25000.00"),
        transaction_type="expense",
    )

    db = SessionLocal()
    result = CreditUtilizationService.get_user_credit_utilization(db, user.id)
    db.close()

    assert len(result.cards) == 1
    card = result.cards[0]
    # Outstanding = 0 (opening) + 25000 (expense) = 25000
    assert card.outstanding_balance == Decimal("25000.00")
    # Utilization = 25000 / 100000 * 100 = 25.00%
    assert card.utilization_percentage == Decimal("25.00")
    assert card.status == "healthy"  # <= 30% is healthy


def test_credit_card_missing_credit_limit():
    user = create_test_user_in_db()
    create_account_in_db(
        user_id=user.id,
        name="Card Without Limit",
        account_type="credit_card",
        balance=Decimal("5000.00"),
        credit_limit=None,
    )

    db = SessionLocal()
    result = CreditUtilizationService.get_user_credit_utilization(db, user.id)
    db.close()

    assert len(result.cards) == 1
    card = result.cards[0]
    assert card.credit_limit is None
    assert card.utilization_percentage is None
    assert card.status == "insufficient_data"
    assert result.aggregate.status == "insufficient_data"


def test_credit_card_zero_or_invalid_limit():
    # Test calculate_card_utilization directly for <= 0 limit
    acc_id = uuid.uuid4()
    item_zero = CreditUtilizationService.calculate_card_utilization(
        outstanding_balance=Decimal("1000.00"),
        credit_limit=Decimal("0.00"),
        account_id=acc_id,
        account_name="Zero Limit Card",
    )
    assert item_zero.utilization_percentage is None
    assert item_zero.status == "insufficient_data"

    item_neg = CreditUtilizationService.calculate_card_utilization(
        outstanding_balance=Decimal("1000.00"),
        credit_limit=Decimal("-500.00"),
        account_id=acc_id,
        account_name="Negative Limit Card",
    )
    assert item_neg.utilization_percentage is None
    assert item_neg.status == "insufficient_data"


def test_multiple_credit_cards_independent_and_aggregate_calculation():
    user = create_test_user_in_db()

    # Card A: Outstanding 20k, Limit 100k -> 20.00%
    acc_a = create_account_in_db(
        user_id=user.id,
        name="Card A",
        account_type="credit_card",
        balance=Decimal("20000.00"),
        credit_limit=Decimal("100000.00"),
    )

    # Card B: Outstanding 30k, Limit 150k -> 20.00%
    acc_b = create_account_in_db(
        user_id=user.id,
        name="Card B",
        account_type="credit_card",
        balance=Decimal("30000.00"),
        credit_limit=Decimal("150000.00"),
    )

    db = SessionLocal()
    result = CreditUtilizationService.get_user_credit_utilization(db, user.id)
    db.close()

    assert len(result.cards) == 2
    card_map = {c.account_name: c for c in result.cards}

    assert card_map["Card A"].outstanding_balance == Decimal("20000.00")
    assert card_map["Card A"].credit_limit == Decimal("100000.00")
    assert card_map["Card A"].utilization_percentage == Decimal("20.00")

    assert card_map["Card B"].outstanding_balance == Decimal("30000.00")
    assert card_map["Card B"].credit_limit == Decimal("150000.00")
    assert card_map["Card B"].utilization_percentage == Decimal("20.00")

    # Aggregate: Total Outstanding 50k / Total Limit 250k * 100 = 20.00%
    assert result.aggregate.total_outstanding == Decimal("50000.00")
    assert result.aggregate.total_credit_limit == Decimal("250000.00")
    assert result.aggregate.utilization_percentage == Decimal("20.00")
    assert result.aggregate.status == "healthy"


def test_decimal_precision_and_rounding():
    # 10,000 / 30,000 * 100 = 33.33333... -> rounds to 33.33%
    item = CreditUtilizationService.calculate_card_utilization(
        outstanding_balance=Decimal("10000.00"),
        credit_limit=Decimal("30000.00"),
        account_id=uuid.uuid4(),
        account_name="Precision Card",
    )
    assert item.utilization_percentage == Decimal("33.33")
    assert item.status == "moderate"  # 30% - 50% is moderate

    # High utilization: 60,000 / 100,000 * 100 = 60.00% -> critical
    item_high = CreditUtilizationService.calculate_card_utilization(
        outstanding_balance=Decimal("60000.00"),
        credit_limit=Decimal("100000.00"),
        account_id=uuid.uuid4(),
        account_name="High Util Card",
    )
    assert item_high.utilization_percentage == Decimal("60.00")
    assert item_high.status == "critical"


def test_no_nan_or_negative_invalid_percentage():
    # If card has negative balance (refund/credit excess)
    item_negative_bal = CreditUtilizationService.calculate_card_utilization(
        outstanding_balance=Decimal("-2500.00"),
        credit_limit=Decimal("50000.00"),
        account_id=uuid.uuid4(),
        account_name="Credit Balance Card",
    )
    # Must be 0.00%, never negative
    assert item_negative_bal.utilization_percentage == Decimal("0.00")
    assert item_negative_bal.status == "healthy"


def test_non_credit_card_accounts_are_ignored():
    user = create_test_user_in_db()

    # Create savings, cash, investment accounts with limits (or balances)
    create_account_in_db(user.id, "Savings Acc", "savings", balance=Decimal("50000.00"))
    create_account_in_db(user.id, "Cash Wallet", "cash", balance=Decimal("1000.00"))
    create_account_in_db(user.id, "Mutual Funds", "investment", balance=Decimal("100000.00"))

    # Only one credit card
    create_account_in_db(
        user.id,
        "Single CC",
        "credit_card",
        balance=Decimal("15000.00"),
        credit_limit=Decimal("50000.00"),
    )

    db = SessionLocal()
    result = CreditUtilizationService.get_user_credit_utilization(db, user.id)
    db.close()

    # Only 1 card evaluated, savings/cash/investment completely excluded
    assert len(result.cards) == 1
    assert result.cards[0].account_name == "Single CC"
    assert result.cards[0].utilization_percentage == Decimal("30.00")


def test_user_isolation():
    user_a = create_test_user_in_db()
    user_b = create_test_user_in_db()

    create_account_in_db(
        user_a.id, "User A CC", "credit_card", balance=Decimal("10000.00"), credit_limit=Decimal("50000.00")
    )
    create_account_in_db(
        user_b.id, "User B CC", "credit_card", balance=Decimal("40000.00"), credit_limit=Decimal("80000.00")
    )

    db = SessionLocal()
    res_a = CreditUtilizationService.get_user_credit_utilization(db, user_a.id)
    res_b = CreditUtilizationService.get_user_credit_utilization(db, user_b.id)
    db.close()

    assert len(res_a.cards) == 1
    assert res_a.cards[0].account_name == "User A CC"
    assert res_a.cards[0].utilization_percentage == Decimal("20.00")

    assert len(res_b.cards) == 1
    assert res_b.cards[0].account_name == "User B CC"
    assert res_b.cards[0].utilization_percentage == Decimal("50.00")
