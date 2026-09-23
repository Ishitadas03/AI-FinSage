"""
Comprehensive tests for the Deterministic Debt Stress Analyzer (Phase 3D-5 Part 1).

Covers:
- no debt
- one loan
- multiple loans
- credit card with valid credit limit
- credit card without credit limit
- zero income
- positive income
- expenses greater than income
- EMI greater than available cash flow
- zero credit-card balance
- multiple credit cards
- missing transaction data
- mixed loans + credit cards
- Decimal precision
- transfer transactions excluded from income/expense
- strict user isolation
- insufficient_data states
- deterministic repeated calculations
"""
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from conftest import TestingSessionLocal
from app.models.account import Account
from app.models.loan import Loan
from app.models.transaction import Transaction
from app.services.debt_stress_service import DebtStressService

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _register_and_login(suffix: str = "") -> dict:
    uid = uuid.uuid4().hex[:8]
    payload = {
        "full_name": f"StressUser {uid} {suffix}".strip(),
        "email": f"stress_{uid}_{suffix.lower()}@example.com",
        "password": "SecurePassword123!",
    }
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201
    login = client.post("/api/v1/auth/login", json={
        "email": payload["email"], "password": payload["password"],
    })
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {
        "user": reg.json(),
        "headers": {"Authorization": f"Bearer {token}"},
        "user_id": uuid.UUID(reg.json()["id"]),
    }


def _create_account(user: dict, name="Acc", atype="savings", balance="0.00",
                     credit_limit=None) -> dict:
    payload = {
        "name": name, "account_type": atype, "balance": balance, "currency": "INR",
    }
    if credit_limit is not None:
        payload["credit_limit"] = credit_limit
    res = client.post("/api/v1/accounts", json=payload, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def _create_tx(user: dict, account_id: str, amount: str, tx_type: str,
               category: str, tx_date: datetime, dest_id: str = None) -> dict:
    payload = {
        "account_id": account_id, "amount": amount, "transaction_type": tx_type,
        "category": category, "transaction_date": tx_date.isoformat(),
    }
    if dest_id:
        payload["destination_account_id"] = dest_id
    res = client.post("/api/v1/transactions", json=payload, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def _create_loan(user: dict, name="Loan", principal="100000.00",
                 outstanding="80000.00", rate="10.0000", tenure=60,
                 emi="2124.70", start="2024-01-01") -> dict:
    res = client.post("/api/v1/loans", json={
        "name": name, "principal_amount": principal,
        "outstanding_principal": outstanding, "interest_rate": rate,
        "tenure_months": tenure, "monthly_emi": emi, "start_date": start,
    }, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def _run_analysis(user: dict, start_date=None, end_date=None):
    db = TestingSessionLocal()
    try:
        return DebtStressService.analyze(
            db, user["user_id"],
            start_date=start_date, end_date=end_date,
        )
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 1. No Debt (no loans, no credit cards, no transactions)
# ---------------------------------------------------------------------------
class TestNoDebt:
    def test_empty_user_debt_summary_zeros(self):
        user = _register_and_login("NoDebt1")
        result = _run_analysis(user)

        assert result.debt_summary.total_outstanding_loan_principal == Decimal("0.00")
        assert result.debt_summary.total_monthly_emi == Decimal("0.00")
        assert result.debt_summary.active_loan_count == 0
        assert result.debt_summary.total_credit_card_debt == Decimal("0.00")
        assert result.debt_summary.total_credit_limit == Decimal("0.00")
        assert result.debt_summary.aggregate_credit_utilization is None

    def test_empty_user_cash_flow_zeros(self):
        user = _register_and_login("NoDebt2")
        result = _run_analysis(user)

        assert result.cash_flow_pressure.monthly_income == Decimal("0.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("0.00")
        assert result.cash_flow_pressure.monthly_net_cash_flow == Decimal("0.00")
        assert result.cash_flow_pressure.monthly_emi == Decimal("0.00")
        assert result.cash_flow_pressure.cash_flow_after_emi == Decimal("0.00")

    def test_empty_user_insufficient_data_states(self):
        user = _register_and_login("NoDebt3")
        result = _run_analysis(user)

        assert result.debt_burden_metrics.emi_to_income_ratio.status == "insufficient_data"
        assert result.debt_burden_metrics.debt_service_pressure.value == Decimal("0.00")

    def test_empty_user_data_completeness(self):
        user = _register_and_login("NoDebt4")
        result = _run_analysis(user)

        fields = [item.field for item in result.data_completeness]
        assert "transaction_history" in fields
        assert "loan_data" in fields
        assert "credit_card_data" in fields


# ---------------------------------------------------------------------------
# 2. One Loan
# ---------------------------------------------------------------------------
class TestOneLoan:
    def test_single_loan_summary(self):
        user = _register_and_login("OneLoan1")
        _create_loan(user, name="Home Loan", principal="5000000.00",
                      outstanding="4200000.00", rate="8.5000", tenure=240,
                      emi="43391.00")
        result = _run_analysis(user)

        assert result.debt_summary.total_outstanding_loan_principal == Decimal("4200000.00")
        assert result.debt_summary.total_monthly_emi == Decimal("43391.00")
        assert result.debt_summary.active_loan_count == 1

    def test_single_loan_with_income(self):
        user = _register_and_login("OneLoan2")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Salary", balance="100000.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=5))
        _create_loan(user, name="Personal", principal="200000.00",
                      outstanding="180000.00", emi="9320.00")

        result = _run_analysis(user)

        assert result.debt_burden_metrics.emi_to_income_ratio.status == "calculated"
        assert result.debt_burden_metrics.emi_to_income_ratio.value == Decimal("9.32")


# ---------------------------------------------------------------------------
# 3. Multiple Loans
# ---------------------------------------------------------------------------
class TestMultipleLoans:
    def test_multiple_loans_aggregation(self):
        user = _register_and_login("MultiLoan1")
        _create_loan(user, name="Home", principal="5000000.00",
                      outstanding="4200000.00", emi="43391.00")
        _create_loan(user, name="Car", principal="800000.00",
                      outstanding="650000.00", emi="16680.00")
        _create_loan(user, name="Personal", principal="200000.00",
                      outstanding="180000.00", emi="9320.00")

        result = _run_analysis(user)

        assert result.debt_summary.total_outstanding_loan_principal == Decimal("5030000.00")
        assert result.debt_summary.total_monthly_emi == Decimal("69391.00")
        assert result.debt_summary.active_loan_count == 3


# ---------------------------------------------------------------------------
# 4. Credit Card with Valid Credit Limit
# ---------------------------------------------------------------------------
class TestCreditCardValidLimit:
    def test_cc_with_limit_utilization(self):
        user = _register_and_login("CCValid1")
        _create_account(user, name="HDFC Card", atype="credit_card",
                        balance="30000.00", credit_limit="100000.00")

        result = _run_analysis(user)

        assert result.debt_summary.total_credit_card_debt == Decimal("30000.00")
        assert result.debt_summary.total_credit_limit == Decimal("100000.00")
        assert result.debt_summary.aggregate_credit_utilization == Decimal("30.00")

    def test_cc_utilization_stress_indicator_healthy(self):
        user = _register_and_login("CCValid2")
        _create_account(user, name="Card", atype="credit_card",
                        balance="20000.00", credit_limit="100000.00")

        result = _run_analysis(user)

        cu_indicator = next(i for i in result.stress_indicators if i.metric == "credit_utilization")
        assert cu_indicator.status == "healthy"
        assert cu_indicator.value == Decimal("20.00")


# ---------------------------------------------------------------------------
# 5. Credit Card Without Credit Limit
# ---------------------------------------------------------------------------
class TestCreditCardNoLimit:
    def test_cc_no_limit_insufficient_data(self):
        user = _register_and_login("CCNoLimit1")
        _create_account(user, name="No Limit Card", atype="credit_card", balance="15000.00")

        result = _run_analysis(user)

        assert result.debt_summary.aggregate_credit_utilization is None
        cu_indicator = next(i for i in result.stress_indicators if i.metric == "credit_utilization")
        assert cu_indicator.status == "insufficient_data"

    def test_cc_no_limit_data_completeness(self):
        user = _register_and_login("CCNoLimit2")
        _create_account(user, name="Mystery Card", atype="credit_card", balance="5000.00")

        result = _run_analysis(user)

        fields = [item.field for item in result.data_completeness]
        assert "credit_limit" in fields


# ---------------------------------------------------------------------------
# 6. Zero Income
# ---------------------------------------------------------------------------
class TestZeroIncome:
    def test_zero_income_emi_insufficient(self):
        user = _register_and_login("ZeroInc1")
        _create_loan(user, emi="5000.00")

        result = _run_analysis(user)

        assert result.debt_burden_metrics.emi_to_income_ratio.status == "insufficient_data"
        assert result.debt_burden_metrics.emi_to_income_ratio.value is None

    def test_zero_income_stress_indicators(self):
        user = _register_and_login("ZeroInc2")
        _create_loan(user, emi="5000.00")

        result = _run_analysis(user)

        emi_ind = next(i for i in result.stress_indicators if i.metric == "emi_burden")
        assert emi_ind.status == "insufficient_data"

        cf_ind = next(i for i in result.stress_indicators if i.metric == "cash_flow_pressure")
        assert cf_ind.status == "insufficient_data"


# ---------------------------------------------------------------------------
# 7. Positive Income
# ---------------------------------------------------------------------------
class TestPositiveIncome:
    def test_positive_income_metrics_calculated(self):
        user = _register_and_login("PosInc1")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="50000.00")
        _create_tx(user, acc["id"], "80000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "30000.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="10000.00")

        result = _run_analysis(user)

        assert result.cash_flow_pressure.monthly_income == Decimal("80000.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("30000.00")
        assert result.cash_flow_pressure.monthly_emi == Decimal("10000.00")
        assert result.cash_flow_pressure.cash_flow_after_emi == Decimal("40000.00")

        assert result.debt_burden_metrics.emi_to_income_ratio.status == "calculated"
        assert result.debt_burden_metrics.emi_to_income_ratio.value == Decimal("12.50")

    def test_positive_income_data_completeness_no_income_gap(self):
        user = _register_and_login("PosInc2")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="50000.00")
        _create_tx(user, acc["id"], "80000.00", "income", "salary", now - timedelta(days=5))

        result = _run_analysis(user)

        fields = [item.field for item in result.data_completeness]
        assert "income_data" not in fields
        assert "transaction_history" not in fields


# ---------------------------------------------------------------------------
# 8. Expenses Greater Than Income
# ---------------------------------------------------------------------------
class TestExpensesGreaterThanIncome:
    def test_negative_cashflow(self):
        user = _register_and_login("ExpGtInc1")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="100000.00")
        _create_tx(user, acc["id"], "30000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "50000.00", "expense", "shopping", now - timedelta(days=2))
        _create_loan(user, emi="5000.00")

        result = _run_analysis(user)

        assert result.cash_flow_pressure.monthly_net_cash_flow == Decimal("-20000.00")
        assert result.cash_flow_pressure.cash_flow_after_emi == Decimal("-25000.00")

        # Debt service pressure should be insufficient_data (net cash flow is negative)
        assert result.debt_burden_metrics.debt_service_pressure.status == "insufficient_data"

    def test_negative_post_emi_cash_flow_metric(self):
        user = _register_and_login("ExpGtInc2")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="100000.00")
        _create_tx(user, acc["id"], "20000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "40000.00", "expense", "rent", now - timedelta(days=2))

        result = _run_analysis(user)

        assert result.debt_burden_metrics.post_emi_cash_flow.value == Decimal("-20000.00")
        assert result.debt_burden_metrics.post_emi_cash_flow.status == "calculated"


# ---------------------------------------------------------------------------
# 9. EMI Greater Than Available Cash Flow
# ---------------------------------------------------------------------------
class TestEmiGreaterThanCashFlow:
    def test_emi_exceeds_net_cashflow(self):
        user = _register_and_login("EmiBig1")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="100000.00")
        _create_tx(user, acc["id"], "50000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "20000.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="40000.00")

        result = _run_analysis(user)

        # Net cash flow = 50k - 20k = 30k, EMI = 40k
        # Cash flow after EMI = 50k - 20k - 40k = -10k
        assert result.cash_flow_pressure.cash_flow_after_emi == Decimal("-10000.00")

        # EMI-to-income = 40000/50000 * 100 = 80.00% -> critical
        assert result.debt_burden_metrics.emi_to_income_ratio.value == Decimal("80.00")
        emi_ind = next(i for i in result.stress_indicators if i.metric == "emi_burden")
        assert emi_ind.status == "critical"


# ---------------------------------------------------------------------------
# 10. Zero Credit Card Balance
# ---------------------------------------------------------------------------
class TestZeroCCBalance:
    def test_zero_balance_healthy(self):
        user = _register_and_login("ZeroCC1")
        _create_account(user, name="Clear Card", atype="credit_card",
                        balance="0.00", credit_limit="50000.00")

        result = _run_analysis(user)

        assert result.debt_summary.total_credit_card_debt == Decimal("0.00")
        assert result.debt_summary.aggregate_credit_utilization == Decimal("0.00")

        cu_ind = next(i for i in result.stress_indicators if i.metric == "credit_utilization")
        assert cu_ind.status == "healthy"
        assert cu_ind.value == Decimal("0.00")


# ---------------------------------------------------------------------------
# 11. Multiple Credit Cards
# ---------------------------------------------------------------------------
class TestMultipleCreditCards:
    def test_aggregate_across_cards(self):
        user = _register_and_login("MultiCC1")
        _create_account(user, name="Card A", atype="credit_card",
                        balance="20000.00", credit_limit="100000.00")
        _create_account(user, name="Card B", atype="credit_card",
                        balance="30000.00", credit_limit="150000.00")

        result = _run_analysis(user)

        # Total debt: 50k, Total limit: 250k -> 20.00%
        assert result.debt_summary.total_credit_card_debt == Decimal("50000.00")
        assert result.debt_summary.total_credit_limit == Decimal("250000.00")
        assert result.debt_summary.aggregate_credit_utilization == Decimal("20.00")

    def test_mixed_limit_cards(self):
        """One card with limit, one without -> only card with limit used for utilization %."""
        user = _register_and_login("MultiCC2")
        _create_account(user, name="Card With Limit", atype="credit_card",
                        balance="20000.00", credit_limit="100000.00")
        _create_account(user, name="Card No Limit", atype="credit_card",
                        balance="10000.00")

        result = _run_analysis(user)

        # Total CC debt includes both cards
        assert result.debt_summary.total_credit_card_debt == Decimal("30000.00")
        # But utilization only counts card with valid limit
        assert result.debt_summary.total_credit_limit == Decimal("100000.00")
        assert result.debt_summary.aggregate_credit_utilization == Decimal("20.00")

        # Data completeness should note missing limit
        fields = [item.field for item in result.data_completeness]
        assert "credit_limit" in fields


# ---------------------------------------------------------------------------
# 12. Missing Transaction Data
# ---------------------------------------------------------------------------
class TestMissingTransactionData:
    def test_no_transactions(self):
        user = _register_and_login("NoTx1")
        _create_account(user, name="Idle Account", balance="50000.00")

        result = _run_analysis(user)

        assert result.cash_flow_pressure.monthly_income == Decimal("0.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("0.00")
        fields = [item.field for item in result.data_completeness]
        assert "transaction_history" in fields

    def test_only_income_no_expenses(self):
        user = _register_and_login("NoTx2")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "50000.00", "income", "salary", now - timedelta(days=3))

        result = _run_analysis(user)

        assert result.cash_flow_pressure.monthly_income == Decimal("50000.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("0.00")
        fields = [item.field for item in result.data_completeness]
        assert "income_data" not in fields


# ---------------------------------------------------------------------------
# 13. Mixed Loans + Credit Cards
# ---------------------------------------------------------------------------
class TestMixedLoansAndCards:
    def test_comprehensive_mixed_scenario(self):
        user = _register_and_login("Mixed1")
        now = datetime.now(timezone.utc)

        acc = _create_account(user, name="Savings", balance="200000.00")
        _create_account(user, name="HDFC CC", atype="credit_card",
                        balance="25000.00", credit_limit="100000.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=10))
        _create_tx(user, acc["id"], "40000.00", "expense", "rent", now - timedelta(days=5))
        _create_loan(user, name="Home", principal="5000000.00",
                      outstanding="4500000.00", emi="43000.00")
        _create_loan(user, name="Car", principal="500000.00",
                      outstanding="400000.00", emi="10000.00")

        result = _run_analysis(user)

        # Debt summary
        assert result.debt_summary.total_outstanding_loan_principal == Decimal("4900000.00")
        assert result.debt_summary.total_monthly_emi == Decimal("53000.00")
        assert result.debt_summary.active_loan_count == 2
        assert result.debt_summary.total_credit_card_debt == Decimal("25000.00")
        assert result.debt_summary.aggregate_credit_utilization == Decimal("25.00")

        # Cash flow
        assert result.cash_flow_pressure.monthly_income == Decimal("100000.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("40000.00")
        assert result.cash_flow_pressure.monthly_emi == Decimal("53000.00")
        assert result.cash_flow_pressure.cash_flow_after_emi == Decimal("7000.00")

        # EMI-to-income = 53000/100000 * 100 = 53.00% -> critical
        assert result.debt_burden_metrics.emi_to_income_ratio.value == Decimal("53.00")
        emi_ind = next(i for i in result.stress_indicators if i.metric == "emi_burden")
        assert emi_ind.status == "critical"


# ---------------------------------------------------------------------------
# 14. Decimal Precision
# ---------------------------------------------------------------------------
class TestDecimalPrecision:
    def test_emi_to_income_precision(self):
        """Verify ROUND_HALF_UP to 2 decimal places."""
        user = _register_and_login("Precision1")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Salary", balance="0.00")
        _create_tx(user, acc["id"], "33333.00", "income", "salary", now - timedelta(days=5))
        _create_loan(user, emi="10000.00")

        result = _run_analysis(user)

        # 10000 / 33333 * 100 = 30.00030..., quantize with ROUND_HALF_UP => 30.00
        assert result.debt_burden_metrics.emi_to_income_ratio.value == Decimal("30.00")

    def test_credit_utilization_precision(self):
        """Verify credit utilization precision with non-trivial numbers."""
        user = _register_and_login("Precision2")
        _create_account(user, name="CC", atype="credit_card",
                        balance="7777.00", credit_limit="33333.00")

        result = _run_analysis(user)

        # 7777 / 33333 * 100 = 23.3312... => 23.33
        assert result.debt_summary.aggregate_credit_utilization == Decimal("23.33")

    def test_debt_service_pressure_precision(self):
        """Verify debt service pressure ratio precision."""
        user = _register_and_login("Precision3")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "77777.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "33333.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="11111.00")

        result = _run_analysis(user)

        # Net cash flow = 77777 - 33333 = 44444
        # DSP = 11111 / 44444 * 100 = 25.0002... => 25.00
        assert result.debt_burden_metrics.debt_service_pressure.value == Decimal("25.00")


# ---------------------------------------------------------------------------
# 15. Transfer Transactions Excluded
# ---------------------------------------------------------------------------
class TestTransfersExcluded:
    def test_transfers_not_counted_as_income_or_expense(self):
        user = _register_and_login("Transfer1")
        now = datetime.now(timezone.utc)

        acc1 = _create_account(user, name="Checking", atype="current", balance="50000.00")
        acc2 = _create_account(user, name="Savings", balance="20000.00")

        # Transfer 10k between accounts
        _create_tx(user, acc1["id"], "10000.00", "transfer", "other",
                   now - timedelta(days=3), dest_id=acc2["id"])

        # Add actual income
        _create_tx(user, acc1["id"], "40000.00", "income", "salary", now - timedelta(days=5))

        result = _run_analysis(user)

        # Transfer should NOT inflate income or expenses
        assert result.cash_flow_pressure.monthly_income == Decimal("40000.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("0.00")

    def test_only_transfers_shows_no_income_expense(self):
        user = _register_and_login("Transfer2")
        now = datetime.now(timezone.utc)

        acc1 = _create_account(user, name="A1", atype="current", balance="50000.00")
        acc2 = _create_account(user, name="A2", balance="20000.00")

        _create_tx(user, acc1["id"], "10000.00", "transfer", "other",
                   now - timedelta(days=3), dest_id=acc2["id"])

        result = _run_analysis(user)

        assert result.cash_flow_pressure.monthly_income == Decimal("0.00")
        assert result.cash_flow_pressure.monthly_expenses == Decimal("0.00")


# ---------------------------------------------------------------------------
# 16. Strict User Isolation
# ---------------------------------------------------------------------------
class TestUserIsolation:
    def test_user_a_data_not_visible_to_user_b(self):
        user_a = _register_and_login("IsoA")
        user_b = _register_and_login("IsoB")

        # User A has a huge loan and credit card debt
        _create_loan(user_a, name="Mega Loan", principal="10000000.00",
                      outstanding="9000000.00", emi="85000.00")
        _create_account(user_a, name="Big CC", atype="credit_card",
                        balance="200000.00", credit_limit="500000.00")

        now = datetime.now(timezone.utc)
        acc_a = _create_account(user_a, name="A Savings", balance="500000.00")
        _create_tx(user_a, acc_a["id"], "200000.00", "income", "salary", now - timedelta(days=5))

        # User B has nothing
        result_b = _run_analysis(user_b)

        assert result_b.debt_summary.total_outstanding_loan_principal == Decimal("0.00")
        assert result_b.debt_summary.total_monthly_emi == Decimal("0.00")
        assert result_b.debt_summary.active_loan_count == 0
        assert result_b.debt_summary.total_credit_card_debt == Decimal("0.00")
        assert result_b.cash_flow_pressure.monthly_income == Decimal("0.00")

    def test_user_b_data_not_visible_to_user_a(self):
        user_a = _register_and_login("IsoC")
        user_b = _register_and_login("IsoD")

        _create_loan(user_b, name="User B Loan", principal="500000.00",
                      outstanding="400000.00", emi="12000.00")

        result_a = _run_analysis(user_a)

        assert result_a.debt_summary.active_loan_count == 0
        assert result_a.debt_summary.total_monthly_emi == Decimal("0.00")


# ---------------------------------------------------------------------------
# 17. Insufficient Data States
# ---------------------------------------------------------------------------
class TestInsufficientDataStates:
    def test_emi_to_income_insufficient_when_no_income(self):
        user = _register_and_login("InsDat1")
        _create_loan(user, emi="10000.00")

        result = _run_analysis(user)
        assert result.debt_burden_metrics.emi_to_income_ratio.status == "insufficient_data"
        assert result.debt_burden_metrics.emi_to_income_ratio.value is None
        assert result.debt_burden_metrics.emi_to_income_ratio.reason is not None

    def test_debt_service_pressure_insufficient_negative_cf(self):
        user = _register_and_login("InsDat2")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "10000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "20000.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="5000.00")

        result = _run_analysis(user)

        # Net cash flow = 10k - 20k = -10k, and EMI > 0
        assert result.debt_burden_metrics.debt_service_pressure.status == "insufficient_data"

    def test_credit_utilization_insufficient_no_cards(self):
        user = _register_and_login("InsDat3")

        result = _run_analysis(user)
        cu_ind = next(i for i in result.stress_indicators if i.metric == "credit_utilization")
        assert cu_ind.status == "insufficient_data"

    def test_debt_balance_insufficient_when_debt_but_no_income(self):
        user = _register_and_login("InsDat4")
        _create_loan(user, principal="500000.00", outstanding="400000.00", emi="10000.00")

        result = _run_analysis(user)

        db_ind = next(i for i in result.stress_indicators if i.metric == "debt_balance")
        assert db_ind.status == "insufficient_data"

    def test_all_indicators_present(self):
        """Every analysis always returns exactly 4 stress indicators."""
        user = _register_and_login("InsDat5")
        result = _run_analysis(user)

        metrics = [i.metric for i in result.stress_indicators]
        assert "emi_burden" in metrics
        assert "cash_flow_pressure" in metrics
        assert "credit_utilization" in metrics
        assert "debt_balance" in metrics
        assert len(result.stress_indicators) == 4


# ---------------------------------------------------------------------------
# 18. Deterministic Repeated Calculations
# ---------------------------------------------------------------------------
class TestDeterminism:
    def test_same_result_on_repeated_calls(self):
        """Same database state must produce identical results."""
        user = _register_and_login("Determ1")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="100000.00")
        _create_tx(user, acc["id"], "80000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "30000.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="15000.00")
        _create_account(user, name="CC", atype="credit_card",
                        balance="20000.00", credit_limit="100000.00")

        # Fix the date range for determinism
        fixed_start = (now.date() - timedelta(days=29))
        fixed_end = now.date()

        result1 = _run_analysis(user, start_date=fixed_start, end_date=fixed_end)
        result2 = _run_analysis(user, start_date=fixed_start, end_date=fixed_end)

        # Compare all key fields
        assert result1.debt_summary == result2.debt_summary
        assert result1.cash_flow_pressure == result2.cash_flow_pressure
        assert result1.debt_burden_metrics == result2.debt_burden_metrics

        for i in range(len(result1.stress_indicators)):
            assert result1.stress_indicators[i].metric == result2.stress_indicators[i].metric
            assert result1.stress_indicators[i].value == result2.stress_indicators[i].value
            assert result1.stress_indicators[i].status == result2.stress_indicators[i].status

    def test_triple_call_determinism(self):
        """Triple invocation with same inputs produces identical outputs."""
        user = _register_and_login("Determ2")
        _create_loan(user, emi="5000.00")

        today = date.today()
        s = today - timedelta(days=29)

        results = [_run_analysis(user, start_date=s, end_date=today) for _ in range(3)]

        for r in results[1:]:
            assert r.debt_summary == results[0].debt_summary
            assert r.debt_burden_metrics.emi_to_income_ratio == results[0].debt_burden_metrics.emi_to_income_ratio


# ---------------------------------------------------------------------------
# 19. Stress Indicator Status Thresholds
# ---------------------------------------------------------------------------
class TestStressThresholds:
    def test_emi_burden_healthy(self):
        user = _register_and_login("Thresh1")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=5))
        _create_loan(user, emi="20000.00")  # 20% -> healthy

        result = _run_analysis(user)
        ind = next(i for i in result.stress_indicators if i.metric == "emi_burden")
        assert ind.status == "healthy"
        assert ind.value == Decimal("20.00")

    def test_emi_burden_elevated(self):
        user = _register_and_login("Thresh2")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=5))
        _create_loan(user, emi="40000.00")  # 40% -> elevated

        result = _run_analysis(user)
        ind = next(i for i in result.stress_indicators if i.metric == "emi_burden")
        assert ind.status == "elevated"
        assert ind.value == Decimal("40.00")

    def test_emi_burden_critical(self):
        user = _register_and_login("Thresh3")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=5))
        _create_loan(user, emi="60000.00")  # 60% -> critical

        result = _run_analysis(user)
        ind = next(i for i in result.stress_indicators if i.metric == "emi_burden")
        assert ind.status == "critical"
        assert ind.value == Decimal("60.00")

    def test_credit_utilization_elevated(self):
        user = _register_and_login("Thresh4")
        _create_account(user, name="CC", atype="credit_card",
                        balance="40000.00", credit_limit="100000.00")  # 40% -> elevated

        result = _run_analysis(user)
        ind = next(i for i in result.stress_indicators if i.metric == "credit_utilization")
        assert ind.status == "elevated"
        assert ind.value == Decimal("40.00")

    def test_credit_utilization_critical(self):
        user = _register_and_login("Thresh5")
        _create_account(user, name="CC", atype="credit_card",
                        balance="60000.00", credit_limit="100000.00")  # 60% -> critical

        result = _run_analysis(user)
        ind = next(i for i in result.stress_indicators if i.metric == "credit_utilization")
        assert ind.status == "critical"
        assert ind.value == Decimal("60.00")

    def test_cash_flow_pressure_critical(self):
        """Post-EMI residual < 5% of income -> critical."""
        user = _register_and_login("Thresh6")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "50000.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="48000.00")

        result = _run_analysis(user)

        # Post-EMI = 100k - 50k - 48k = 2k -> 2% of income
        ind = next(i for i in result.stress_indicators if i.metric == "cash_flow_pressure")
        assert ind.status == "critical"
        assert ind.value == Decimal("2.00")

    def test_debt_balance_healthy(self):
        user = _register_and_login("Thresh7")
        now = datetime.now(timezone.utc)
        acc = _create_account(user, name="Main", balance="0.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=5))
        _create_loan(user, principal="100000.00", outstanding="100000.00", emi="5000.00")

        result = _run_analysis(user)

        # Debt balance = 100000 / 100000 * 100 = 100% -> healthy (≤ 200%)
        ind = next(i for i in result.stress_indicators if i.metric == "debt_balance")
        assert ind.status == "healthy"
        assert ind.value == Decimal("100.00")

    def test_debt_balance_no_debt_no_income(self):
        """No debt and no income -> healthy with 0%."""
        user = _register_and_login("Thresh8")
        result = _run_analysis(user)

        ind = next(i for i in result.stress_indicators if i.metric == "debt_balance")
        assert ind.status == "healthy"
        assert ind.value == Decimal("0.00")


# ---------------------------------------------------------------------------
# 20. Response Structure Validation
# ---------------------------------------------------------------------------
class TestResponseStructure:
    def test_all_required_fields_present(self):
        user = _register_and_login("Struct1")
        result = _run_analysis(user)

        assert result.user_id == user["user_id"]
        assert result.analysis_date is not None
        assert result.start_date is not None
        assert result.end_date is not None
        assert result.days_in_period >= 1
        assert result.debt_summary is not None
        assert result.cash_flow_pressure is not None
        assert result.debt_burden_metrics is not None
        assert isinstance(result.stress_indicators, list)
        assert isinstance(result.data_completeness, list)

    def test_debt_burden_metrics_names(self):
        user = _register_and_login("Struct2")
        result = _run_analysis(user)

        assert result.debt_burden_metrics.emi_to_income_ratio.name == "emi_to_income_ratio"
        assert result.debt_burden_metrics.post_emi_cash_flow.name == "post_emi_cash_flow"
        assert result.debt_burden_metrics.debt_service_pressure.name == "debt_service_pressure"

    def test_stress_indicator_benchmarks_present(self):
        """All stress indicators should have benchmark text."""
        user = _register_and_login("Struct3")
        result = _run_analysis(user)

        for indicator in result.stress_indicators:
            assert indicator.benchmark is not None
            assert "FinSage reference" in indicator.benchmark
