from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper fixture to register and log in a unique user, returning user data and auth header."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"User {uid} {name_suffix}".strip(),
        "email": f"health_{uid}_{name_suffix.lower()}@example.com",
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


def create_account(
    user: dict,
    name: str = "Primary Savings",
    account_type: str = "savings",
    balance: str = "50000.00",
) -> dict:
    res = client.post(
        "/api/v1/accounts",
        json={
            "name": name,
            "account_type": account_type,
            "balance": balance,
            "currency": "INR",
        },
        headers=user["headers"],
    )
    assert res.status_code == 201
    return res.json()


def create_tx(
    user: dict,
    account_id: str,
    amount: str,
    tx_type: str,
    category: str,
    tx_date: datetime,
    merchant: str = None,
    dest_account_id: str = None,
) -> dict:
    payload = {
        "account_id": account_id,
        "amount": amount,
        "transaction_type": tx_type,
        "category": category,
        "transaction_date": tx_date.isoformat(),
        "merchant": merchant,
    }
    if dest_account_id:
        payload["destination_account_id"] = dest_account_id

    res = client.post("/api/v1/transactions", json=payload, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def test_financial_health_empty_user():
    """Test health overview on a new user with no accounts or transactions."""
    user = register_and_login_user("Empty")
    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert Decimal(str(data["liquid_assets"])) == Decimal("0.00")
    assert Decimal(str(data["credit_card_debt"])) == Decimal("0.00")
    assert Decimal(str(data["investment_assets"])) == Decimal("0.00")
    assert Decimal(str(data["total_assets"])) == Decimal("0.00")
    assert Decimal(str(data["total_income"])) == Decimal("0.00")
    assert Decimal(str(data["total_expenses"])) == Decimal("0.00")
    assert Decimal(str(data["net_cashflow"])) == Decimal("0.00")

    # Metrics fallback properly
    assert data["savings_rate"]["status"] == "insufficient_data"
    assert data["expense_ratio"]["status"] == "insufficient_data"
    assert data["emergency_fund_coverage_months"]["status"] == "insufficient_data"
    assert data["debt_to_liquid_ratio"]["status"] == "healthy"
    assert Decimal(str(data["debt_to_liquid_ratio"]["value"])) == Decimal("0.00")
    assert data["investment_allocation_ratio"]["status"] == "insufficient_data"
    assert len(data["data_completeness_notes"]) >= 3


def test_financial_health_comprehensive():
    """
    Test comprehensive financial health overview with:
    - Savings Account: 100,000 INR
    - Credit Card Account: 15,000 INR debt
    - Investment Account: 50,000 INR
    - Income: 80,000 INR
    - Expenses: 40,000 INR (50% expense ratio, 50% savings rate)
    """
    user = register_and_login_user("Comprehensive")
    now = datetime.now(timezone.utc)

    acc_savings = create_account(user, name="HDFC Savings", account_type="savings", balance="100000.00")
    acc_cc = create_account(user, name="ICICI Coral Card", account_type="credit_card", balance="15000.00")
    acc_inv = create_account(user, name="Zerodha Demat", account_type="investment", balance="50000.00")

    # Add income and expense transactions
    create_tx(
        user=user,
        account_id=acc_savings["id"],
        amount="80000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=5),
    )
    create_tx(
        user=user,
        account_id=acc_savings["id"],
        amount="40000.00",
        tx_type="expense",
        category="rent",
        tx_date=now - timedelta(days=2),
    )

    # In savings account:
    # opening 100,000 + 80,000 (income) - 40,000 (expense) = 140,000 current_balance
    # Liquid assets = 140,000
    # CC debt = 15,000
    # Investment = 50,000
    # Total assets = 140,000 + 50,000 = 190,000
    # Period: 30 days
    # Monthly expense rate: (40,000 / 30) * 30 = 40,000
    # Emergency fund months: 140,000 / 40,000 = 3.50 months (moderate)
    # Savings rate: (80,000 - 40,000)/80,000 = 50.00% (healthy)
    # Expense ratio: 40,000 / 80,000 = 50.00% (healthy)
    # Debt to liquid ratio: (15,000 / 140,000) * 100 = 10.71% (healthy)
    # Investment allocation: (50,000 / 190,000) * 100 = 26.32% (healthy)

    start_date_str = (now.date() - timedelta(days=29)).isoformat()
    end_date_str = now.date().isoformat()

    res = client.get(
        f"/api/v1/financial-health/overview?start_date={start_date_str}&end_date={end_date_str}",
        headers=user["headers"],
    )
    assert res.status_code == 200
    data = res.json()

    assert Decimal(str(data["liquid_assets"])) == Decimal("140000.00")
    assert Decimal(str(data["credit_card_debt"])) == Decimal("15000.00")
    assert Decimal(str(data["investment_assets"])) == Decimal("50000.00")
    assert Decimal(str(data["total_assets"])) == Decimal("190000.00")
    assert Decimal(str(data["total_income"])) == Decimal("80000.00")
    assert Decimal(str(data["total_expenses"])) == Decimal("40000.00")
    assert Decimal(str(data["net_cashflow"])) == Decimal("40000.00")

    # Verify deterministic health metrics
    assert Decimal(str(data["savings_rate"]["value"])) == Decimal("50.00")
    assert data["savings_rate"]["status"] == "healthy"

    assert Decimal(str(data["expense_ratio"]["value"])) == Decimal("50.00")
    assert data["expense_ratio"]["status"] == "healthy"

    assert Decimal(str(data["emergency_fund_coverage_months"]["value"])) == Decimal("3.50")
    assert data["emergency_fund_coverage_months"]["status"] == "moderate"

    assert Decimal(str(data["debt_to_liquid_ratio"]["value"])) == Decimal("10.71")
    assert data["debt_to_liquid_ratio"]["status"] == "healthy"

    assert Decimal(str(data["investment_allocation_ratio"]["value"])) == Decimal("26.32")
    assert data["investment_allocation_ratio"]["status"] == "healthy"


def test_financial_health_negative_cash_flow():
    """Test scenario where expenses exceed income (negative cash flow)."""
    user = register_and_login_user("NegativeCashflow")
    now = datetime.now(timezone.utc)

    acc = create_account(user, name="Main Current", account_type="current", balance="20000.00")

    create_tx(
        user=user,
        account_id=acc["id"],
        amount="10000.00",
        tx_type="income",
        category="other",
        tx_date=now - timedelta(days=3),
    )
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="25000.00",
        tx_type="expense",
        category="shopping",
        tx_date=now - timedelta(days=1),
    )

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    # Savings rate is (10,000 - 25,000) / 10,000 * 100 = -150.00% -> critical
    assert Decimal(str(data["savings_rate"]["value"])) == Decimal("-150.00")
    assert data["savings_rate"]["status"] == "critical"

    # Expense ratio is 250.00% -> critical
    assert Decimal(str(data["expense_ratio"]["value"])) == Decimal("250.00")
    assert data["expense_ratio"]["status"] == "critical"


def test_financial_health_zero_expense():
    """Test zero expense edge case: emergency fund coverage should report insufficient_data."""
    user = register_and_login_user("ZeroExpense")
    now = datetime.now(timezone.utc)

    acc = create_account(user, name="Emergency Stash", account_type="savings", balance="50000.00")

    create_tx(
        user=user,
        account_id=acc["id"],
        amount="30000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=4),
    )

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert data["emergency_fund_coverage_months"]["value"] is None
    assert data["emergency_fund_coverage_months"]["status"] == "insufficient_data"


def test_financial_health_user_isolation():
    """Verify complete data isolation between separate users."""
    user1 = register_and_login_user("IsoUser1")
    user2 = register_and_login_user("IsoUser2")

    create_account(user1, name="Secret Wealth Account", account_type="savings", balance="999999.00")
    create_account(user2, name="Normal Account", account_type="savings", balance="1000.00")

    res = client.get("/api/v1/financial-health/overview", headers=user2["headers"])
    assert res.status_code == 200
    data = res.json()

    assert Decimal(str(data["liquid_assets"])) == Decimal("1000.00")
    assert Decimal(str(data["total_assets"])) == Decimal("1000.00")


def test_financial_health_date_filter():
    """Verify date filters constrain income and expense calculations."""
    user = register_and_login_user("DateFilter")
    now = datetime.now(timezone.utc)

    acc = create_account(user, name="Savings", account_type="savings", balance="10000.00")

    # Transaction 1: 50 days ago
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="50000.00",
        tx_type="income",
        category="other",
        tx_date=now - timedelta(days=50),
    )
    # Transaction 2: 5 days ago
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="10000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=5),
    )

    # Query only last 10 days
    start = (now.date() - timedelta(days=10)).isoformat()
    end = now.date().isoformat()

    res = client.get(
        f"/api/v1/financial-health/overview?start_date={start}&end_date={end}",
        headers=user["headers"],
    )
    assert res.status_code == 200
    data = res.json()

    # Period income should only be 10,000 (excluding 50,000 from 50 days ago)
    assert Decimal(str(data["total_income"])) == Decimal("10000.00")


def test_financial_health_transfers_excluded_from_cashflow():
    """Verify that transfers between accounts do NOT inflate income/expense or distort health ratios."""
    user = register_and_login_user("TransferExclusion")
    now = datetime.now(timezone.utc)

    acc1 = create_account(user, name="Checking", account_type="current", balance="50000.00")
    acc2 = create_account(user, name="Savings", account_type="savings", balance="20000.00")

    # Perform an internal transfer of 10,000 from Checking to Savings
    create_tx(
        user=user,
        account_id=acc1["id"],
        amount="10000.00",
        tx_type="transfer",
        category="other",
        tx_date=now - timedelta(days=2),
        dest_account_id=acc2["id"],
    )

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    # Income and expenses should remain 0.00
    assert Decimal(str(data["total_income"])) == Decimal("0.00")
    assert Decimal(str(data["total_expenses"])) == Decimal("0.00")
    # Total liquid assets should still be 50k - 10k + 20k + 10k = 70,000
    assert Decimal(str(data["liquid_assets"])) == Decimal("70000.00")


def test_financial_health_account_filter():
    """Verify filtering financial health by specific account."""
    user = register_and_login_user("AccountFilter")
    now = datetime.now(timezone.utc)

    acc1 = create_account(user, name="Salary Account", account_type="savings", balance="60000.00")
    acc2 = create_account(user, name="Secondary Account", account_type="savings", balance="30000.00")

    create_tx(
        user=user,
        account_id=acc1["id"],
        amount="50000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=2),
    )
    create_tx(
        user=user,
        account_id=acc2["id"],
        amount="20000.00",
        tx_type="income",
        category="other",
        tx_date=now - timedelta(days=2),
    )

    res = client.get(
        f"/api/v1/financial-health/overview?account_id={acc1['id']}",
        headers=user["headers"],
    )
    assert res.status_code == 200
    data = res.json()

    # Liquid assets and income should be constrained to acc1
    assert Decimal(str(data["liquid_assets"])) == Decimal("110000.00")
    assert Decimal(str(data["total_income"])) == Decimal("50000.00")


def test_financial_health_includes_credit_utilization_valid_card():
    """Verify Credit Card Utilization is correctly calculated in financial health overview."""
    user = register_and_login_user("CCHealthValid")
    now = datetime.now(timezone.utc)

    # Create credit card with 100,000 limit and 20,000 opening balance
    acc_cc = client.post(
        "/api/v1/accounts",
        json={
            "name": "HDFC Millennia",
            "account_type": "credit_card",
            "balance": "20000.00",
            "credit_limit": "100000.00",
            "currency": "INR",
        },
        headers=user["headers"],
    ).json()

    # Post an extra 10,000 expense -> total debt = 30,000 -> 30.00% utilization (healthy)
    create_tx(
        user=user,
        account_id=acc_cc["id"],
        amount="10000.00",
        tx_type="expense",
        category="shopping",
        tx_date=now - timedelta(days=2),
    )

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert "credit_card_utilization" in data
    assert Decimal(str(data["credit_card_utilization"]["value"])) == Decimal("30.00")
    assert data["credit_card_utilization"]["status"] == "healthy"
    assert "%" in data["credit_card_utilization"]["unit"]

    # Verify per-card breakdown exists
    assert "credit_card_details" in data
    assert len(data["credit_card_details"]) == 1
    assert data["credit_card_details"][0]["account_name"] == "HDFC Millennia"
    assert Decimal(str(data["credit_card_details"][0]["utilization_percentage"])) == Decimal("30.00")


def test_financial_health_credit_utilization_missing_limit():
    """Verify missing credit limit results in insufficient_data status."""
    user = register_and_login_user("CCHealthMissingLimit")
    create_account(user, name="No Limit Card", account_type="credit_card", balance="15000.00")

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert data["credit_card_utilization"]["value"] is None
    assert data["credit_card_utilization"]["status"] == "insufficient_data"


def test_financial_health_multiple_credit_cards_aggregate():
    """Verify aggregated utilization uses SUM(debt)/SUM(limits) across multiple cards."""
    user = register_and_login_user("CCHealthMulti")

    # Card 1: 20k / 100k
    client.post("/api/v1/accounts", json={
        "name": "Card 1",
        "account_type": "credit_card",
        "balance": "20000.00",
        "credit_limit": "100000.00",
        "currency": "INR",
    }, headers=user["headers"])

    # Card 2: 30k / 150k
    client.post("/api/v1/accounts", json={
        "name": "Card 2",
        "account_type": "credit_card",
        "balance": "30000.00",
        "credit_limit": "150000.00",
        "currency": "INR",
    }, headers=user["headers"])

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    # Total Debt: 50,000 / Total Limit: 250,000 = 20.00%
    assert Decimal(str(data["credit_card_utilization"]["value"])) == Decimal("20.00")
    assert data["credit_card_utilization"]["status"] == "healthy"
    assert len(data["credit_card_details"]) == 2


def test_financial_health_includes_loans_summary():
    """Verify Loan summary metrics (total outstanding principal, monthly EMI, active count) are integrated."""
    user = register_and_login_user("LoanHealthSummary")

    # Create 2 loans
    client.post("/api/v1/loans", json={
        "name": "Home Loan",
        "principal_amount": "5000000.00",
        "outstanding_principal": "4200000.00",
        "interest_rate": "8.5000",
        "tenure_months": 240,
        "monthly_emi": "43391.00",
        "start_date": "2024-01-01",
    }, headers=user["headers"])

    client.post("/api/v1/loans", json={
        "name": "Car Loan",
        "principal_amount": "800000.00",
        "outstanding_principal": "650000.00",
        "interest_rate": "9.2000",
        "tenure_months": 60,
        "monthly_emi": "16680.00",
        "start_date": "2024-06-01",
    }, headers=user["headers"])

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert Decimal(str(data["total_outstanding_loan_principal"])) == Decimal("4850000.00")
    assert Decimal(str(data["total_monthly_emi"])) == Decimal("60071.00")
    assert data["active_loan_count"] == 2


def test_financial_health_dti_insufficient_data():
    """Verify DTI status is insufficient_data and does not inappropriately use net income or transaction totals."""
    user = register_and_login_user("DTIHealth")

    # Add a loan and an account with transactions
    client.post("/api/v1/loans", json={
        "name": "Personal Loan",
        "principal_amount": "200000.00",
        "outstanding_principal": "180000.00",
        "interest_rate": "11.0000",
        "tenure_months": 24,
        "monthly_emi": "9320.00",
        "start_date": "2025-01-01",
    }, headers=user["headers"])

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert "debt_to_income_ratio" in data
    assert data["debt_to_income_ratio"]["value"] is None
    assert data["debt_to_income_ratio"]["status"] == "insufficient_data"
    assert "gross income" in data["debt_to_income_ratio"]["explanation"].lower()


def test_financial_health_user_isolation_with_loans_and_cards():
    """Verify loans and credit cards of User A are not leaked to User B's financial health overview."""
    user_a = register_and_login_user("IsoA")
    user_b = register_and_login_user("IsoB")

    # User A has loans and high credit limit
    client.post("/api/v1/loans", json={
        "name": "User A Mega Loan",
        "principal_amount": "10000000.00",
        "outstanding_principal": "9000000.00",
        "interest_rate": "8.0000",
        "tenure_months": 240,
        "monthly_emi": "85000.00",
        "start_date": "2024-01-01",
    }, headers=user_a["headers"])

    client.post("/api/v1/accounts", json={
        "name": "User A CC",
        "account_type": "credit_card",
        "balance": "80000.00",
        "credit_limit": "200000.00",
        "currency": "INR",
    }, headers=user_a["headers"])

    # User B has no loans and no credit cards
    res_b = client.get("/api/v1/financial-health/overview", headers=user_b["headers"])
    assert res_b.status_code == 200
    data_b = res_b.json()

    assert Decimal(str(data_b["total_outstanding_loan_principal"])) == Decimal("0.00")
    assert Decimal(str(data_b["total_monthly_emi"])) == Decimal("0.00")
    assert data_b["active_loan_count"] == 0
    assert Decimal(str(data_b["credit_card_debt"])) == Decimal("0.00")
    assert data_b["credit_card_utilization"]["status"] == "insufficient_data"
    assert len(data_b["credit_card_details"]) == 0


# ---------------------------------------------------------------------------
# Integrated Debt Stress Tests (Phase 3D-5 Part 3)
# ---------------------------------------------------------------------------
def test_financial_health_includes_debt_stress_empty_user():
    """Verify empty user has fully populated debt_stress structure in financial health overview."""
    user = register_and_login_user("StressEmpty")
    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    assert "debt_stress" in data
    ds = data["debt_stress"]
    assert ds is not None
    assert ds["user_id"] == user["user"]["id"]
    assert ds["analysis_date"] is not None
    assert ds["start_date"] is not None
    assert ds["end_date"] is not None
    assert ds["days_in_period"] >= 1

    # Debt Summary
    assert Decimal(str(ds["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("0.00")
    assert Decimal(str(ds["debt_summary"]["total_monthly_emi"])) == Decimal("0.00")
    assert ds["debt_summary"]["active_loan_count"] == 0
    assert Decimal(str(ds["debt_summary"]["total_credit_card_debt"])) == Decimal("0.00")
    assert Decimal(str(ds["debt_summary"]["total_credit_limit"])) == Decimal("0.00")
    assert ds["debt_summary"]["aggregate_credit_utilization"] is None

    # Cash Flow Pressure
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_income"])) == Decimal("0.00")
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_expenses"])) == Decimal("0.00")
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_net_cash_flow"])) == Decimal("0.00")
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_emi"])) == Decimal("0.00")
    assert Decimal(str(ds["cash_flow_pressure"]["cash_flow_after_emi"])) == Decimal("0.00")

    # Debt Burden Metrics
    assert ds["debt_burden_metrics"]["emi_to_income_ratio"]["status"] == "insufficient_data"
    assert ds["debt_burden_metrics"]["emi_to_income_ratio"]["value"] is None
    assert Decimal(str(ds["debt_burden_metrics"]["post_emi_cash_flow"]["value"])) == Decimal("0.00")
    assert Decimal(str(ds["debt_burden_metrics"]["debt_service_pressure"]["value"])) == Decimal("0.00")

    # Stress Indicators: exactly 4 indicators present
    indicators = {i["metric"]: i for i in ds["stress_indicators"]}
    assert "emi_burden" in indicators
    assert "cash_flow_pressure" in indicators
    assert "credit_utilization" in indicators
    assert "debt_balance" in indicators
    assert len(ds["stress_indicators"]) == 4

    # Data completeness notes present
    assert len(ds["data_completeness"]) >= 1


def test_financial_health_includes_debt_stress_with_data():
    """Verify integrated debt_stress with active loans, credit cards, income, and expenses."""
    user = register_and_login_user("StressWithData")
    now = datetime.now(timezone.utc)

    # 1. Savings account + transactions
    acc_savings = create_account(user, name="Main Savings", account_type="savings", balance="100000.00")
    create_tx(
        user=user,
        account_id=acc_savings["id"],
        amount="100000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=5),
    )
    create_tx(
        user=user,
        account_id=acc_savings["id"],
        amount="40000.00",
        tx_type="expense",
        category="rent",
        tx_date=now - timedelta(days=2),
    )

    # 2. Credit Card
    client.post("/api/v1/accounts", json={
        "name": "HDFC Card",
        "account_type": "credit_card",
        "balance": "20000.00",
        "credit_limit": "100000.00",
        "currency": "INR",
    }, headers=user["headers"])

    # 3. Loan
    client.post("/api/v1/loans", json={
        "name": "Auto Loan",
        "principal_amount": "500000.00",
        "outstanding_principal": "400000.00",
        "interest_rate": "9.5000",
        "tenure_months": 48,
        "monthly_emi": "12560.00",
        "start_date": "2024-01-01",
    }, headers=user["headers"])

    res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()

    # Core financial health backward compatibility checks
    assert Decimal(str(data["total_income"])) == Decimal("100000.00")
    assert Decimal(str(data["total_expenses"])) == Decimal("40000.00")
    assert Decimal(str(data["total_outstanding_loan_principal"])) == Decimal("400000.00")
    assert Decimal(str(data["total_monthly_emi"])) == Decimal("12560.00")
    assert data["active_loan_count"] == 1

    # Debt stress section checks
    ds = data["debt_stress"]
    assert ds is not None
    assert Decimal(str(ds["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("400000.00")
    assert Decimal(str(ds["debt_summary"]["total_monthly_emi"])) == Decimal("12560.00")
    assert ds["debt_summary"]["active_loan_count"] == 1
    assert Decimal(str(ds["debt_summary"]["total_credit_card_debt"])) == Decimal("20000.00")
    assert Decimal(str(ds["debt_summary"]["total_credit_limit"])) == Decimal("100000.00")
    assert Decimal(str(ds["debt_summary"]["aggregate_credit_utilization"])) == Decimal("20.00")

    # Cash flow pressure
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_income"])) == Decimal("100000.00")
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_expenses"])) == Decimal("40000.00")
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_net_cash_flow"])) == Decimal("60000.00")
    assert Decimal(str(ds["cash_flow_pressure"]["monthly_emi"])) == Decimal("12560.00")
    assert Decimal(str(ds["cash_flow_pressure"]["cash_flow_after_emi"])) == Decimal("47440.00")

    # Debt burden metrics: EMI-to-income = 12560 / 100000 * 100 = 12.56%
    assert ds["debt_burden_metrics"]["emi_to_income_ratio"]["status"] == "calculated"
    assert Decimal(str(ds["debt_burden_metrics"]["emi_to_income_ratio"]["value"])) == Decimal("12.56")
    assert Decimal(str(ds["debt_burden_metrics"]["post_emi_cash_flow"]["value"])) == Decimal("47440.00")

    # Debt-service pressure = 12560 / 60000 * 100 = 20.93%
    assert ds["debt_burden_metrics"]["debt_service_pressure"]["status"] == "calculated"
    assert Decimal(str(ds["debt_burden_metrics"]["debt_service_pressure"]["value"])) == Decimal("20.93")

    # Stress indicators
    ind_map = {i["metric"]: i for i in ds["stress_indicators"]}
    assert ind_map["emi_burden"]["status"] == "healthy"  # 12.56% <= 30%
    assert ind_map["credit_utilization"]["status"] == "healthy"  # 20.00% <= 30%


def test_financial_health_debt_stress_matches_direct_endpoint():
    """Verify that the debt_stress sub-object matches GET /api/v1/debt-stress/overview exactly."""
    user = register_and_login_user("StressMatch")
    now = datetime.now(timezone.utc)

    acc = create_account(user, name="Savings", account_type="savings", balance="80000.00")
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="75000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=5),
    )
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="25000.00",
        tx_type="expense",
        category="rent",
        tx_date=now - timedelta(days=2),
    )
    client.post("/api/v1/loans", json={
        "name": "Personal Loan",
        "principal_amount": "200000.00",
        "outstanding_principal": "150000.00",
        "interest_rate": "12.0000",
        "tenure_months": 24,
        "monthly_emi": "9415.00",
        "start_date": "2024-06-01",
    }, headers=user["headers"])

    # 1. Fetch from Financial Health
    health_res = client.get("/api/v1/financial-health/overview", headers=user["headers"])
    assert health_res.status_code == 200
    health_data = health_res.json()

    # 2. Fetch directly from Debt Stress
    direct_res = client.get("/api/v1/debt-stress/overview", headers=user["headers"])
    assert direct_res.status_code == 200
    direct_data = direct_res.json()

    # Verify identical fields
    assert health_data["debt_stress"]["user_id"] == direct_data["user_id"]
    assert health_data["debt_stress"]["debt_summary"] == direct_data["debt_summary"]
    assert health_data["debt_stress"]["cash_flow_pressure"] == direct_data["cash_flow_pressure"]
    assert health_data["debt_stress"]["debt_burden_metrics"] == direct_data["debt_burden_metrics"]
    assert health_data["debt_stress"]["stress_indicators"] == direct_data["stress_indicators"]
    assert health_data["debt_stress"]["data_completeness"] == direct_data["data_completeness"]


def test_financial_health_debt_stress_date_filter_propagation():
    """Verify date parameters are correctly passed through to the debt stress analysis."""
    user = register_and_login_user("StressDateFilter")
    now = datetime.now(timezone.utc)

    acc = create_account(user, name="Savings", account_type="savings", balance="10000.00")

    # Transaction 50 days ago (should be excluded by 10-day filter)
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="50000.00",
        tx_type="income",
        category="other",
        tx_date=now - timedelta(days=50),
    )
    # Transaction 5 days ago (should be included)
    create_tx(
        user=user,
        account_id=acc["id"],
        amount="20000.00",
        tx_type="income",
        category="salary",
        tx_date=now - timedelta(days=5),
    )

    start = (now.date() - timedelta(days=10)).isoformat()
    end = now.date().isoformat()

    res = client.get(
        f"/api/v1/financial-health/overview?start_date={start}&end_date={end}",
        headers=user["headers"],
    )
    assert res.status_code == 200
    data = res.json()

    assert data["start_date"] == start
    assert data["end_date"] == end
    assert data["debt_stress"]["start_date"] == start
    assert data["debt_stress"]["end_date"] == end
    assert Decimal(str(data["debt_stress"]["cash_flow_pressure"]["monthly_income"])) == Decimal("20000.00")

