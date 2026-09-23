"""
API tests for the Debt Stress Analyzer endpoint (Phase 3D-5 Part 2).

Covers:
- Authentication (unauthenticated rejected, authenticated succeeds)
- User isolation (bidirectional)
- Basic scenarios (empty, loans, credit cards, mixed)
- Response structure validation
- API-to-service consistency
- Deterministic repeated API calls
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from conftest import TestingSessionLocal
from app.services.debt_stress_service import DebtStressService

client = TestClient(app)

ENDPOINT = "/api/v1/debt-stress/overview"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _register_and_login(suffix: str = "") -> dict:
    uid = uuid.uuid4().hex[:8]
    payload = {
        "full_name": f"DSApi {uid} {suffix}".strip(),
        "email": f"dsapi_{uid}_{suffix.lower()}@example.com",
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


def _create_account(user, name="Acc", atype="savings", balance="0.00",
                     credit_limit=None):
    payload = {
        "name": name, "account_type": atype, "balance": balance, "currency": "INR",
    }
    if credit_limit is not None:
        payload["credit_limit"] = credit_limit
    res = client.post("/api/v1/accounts", json=payload, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def _create_tx(user, account_id, amount, tx_type, category, tx_date,
               dest_id=None):
    payload = {
        "account_id": account_id, "amount": amount, "transaction_type": tx_type,
        "category": category, "transaction_date": tx_date.isoformat(),
    }
    if dest_id:
        payload["destination_account_id"] = dest_id
    res = client.post("/api/v1/transactions", json=payload, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


def _create_loan(user, name="Loan", principal="100000.00",
                 outstanding="80000.00", rate="10.0000", tenure=60,
                 emi="2124.70", start="2024-01-01"):
    res = client.post("/api/v1/loans", json={
        "name": name, "principal_amount": principal,
        "outstanding_principal": outstanding, "interest_rate": rate,
        "tenure_months": tenure, "monthly_emi": emi, "start_date": start,
    }, headers=user["headers"])
    assert res.status_code == 201
    return res.json()


# ---------------------------------------------------------------------------
# 1. Authentication
# ---------------------------------------------------------------------------
class TestAuthentication:
    def test_unauthenticated_request_rejected(self):
        """Unauthenticated request returns 401."""
        res = client.get(ENDPOINT)
        assert res.status_code == 401

    def test_invalid_token_rejected(self):
        """Invalid JWT token returns 401."""
        res = client.get(ENDPOINT, headers={"Authorization": "Bearer invalidtoken123"})
        assert res.status_code == 401

    def test_authenticated_request_succeeds(self):
        """Valid authenticated request returns 200."""
        user = _register_and_login("AuthOK")
        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# 2. User Isolation
# ---------------------------------------------------------------------------
class TestUserIsolation:
    def test_user_a_cannot_see_user_b_data(self):
        """User A's loans/CC data must not appear in User B's response."""
        user_a = _register_and_login("IsoApiA")
        user_b = _register_and_login("IsoApiB")

        # User A has a large loan and credit card
        _create_loan(user_a, name="A Mega Loan", principal="10000000.00",
                      outstanding="9000000.00", emi="85000.00")
        _create_account(user_a, name="A Big CC", atype="credit_card",
                        balance="200000.00", credit_limit="500000.00")

        # User B queries the endpoint
        res_b = client.get(ENDPOINT, headers=user_b["headers"])
        assert res_b.status_code == 200
        data_b = res_b.json()

        assert Decimal(str(data_b["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("0.00")
        assert Decimal(str(data_b["debt_summary"]["total_monthly_emi"])) == Decimal("0.00")
        assert data_b["debt_summary"]["active_loan_count"] == 0
        assert Decimal(str(data_b["debt_summary"]["total_credit_card_debt"])) == Decimal("0.00")

    def test_mixed_data_isolation(self):
        """Both users have data; each sees only their own."""
        user_a = _register_and_login("IsoApiC")
        user_b = _register_and_login("IsoApiD")

        _create_loan(user_a, name="A Loan", principal="500000.00",
                      outstanding="400000.00", emi="12000.00")
        _create_loan(user_b, name="B Loan", principal="200000.00",
                      outstanding="150000.00", emi="5000.00")

        res_a = client.get(ENDPOINT, headers=user_a["headers"])
        res_b = client.get(ENDPOINT, headers=user_b["headers"])

        data_a = res_a.json()
        data_b = res_b.json()

        assert Decimal(str(data_a["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("400000.00")
        assert Decimal(str(data_a["debt_summary"]["total_monthly_emi"])) == Decimal("12000.00")
        assert data_a["debt_summary"]["active_loan_count"] == 1

        assert Decimal(str(data_b["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("150000.00")
        assert Decimal(str(data_b["debt_summary"]["total_monthly_emi"])) == Decimal("5000.00")
        assert data_b["debt_summary"]["active_loan_count"] == 1


# ---------------------------------------------------------------------------
# 3. Basic Scenarios
# ---------------------------------------------------------------------------
class TestEmptyUser:
    def test_empty_user_returns_valid_response(self):
        """A user with no data gets a valid response with insufficient_data states."""
        user = _register_and_login("EmptyApi")
        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        # Debt summary zeroed
        assert data["debt_summary"]["active_loan_count"] == 0
        assert Decimal(str(data["debt_summary"]["total_monthly_emi"])) == Decimal("0.00")

        # Cash flow zeroed
        assert Decimal(str(data["cash_flow_pressure"]["monthly_income"])) == Decimal("0.00")

        # Stress indicators present
        assert len(data["stress_indicators"]) == 4

        # Data completeness notes present
        assert len(data["data_completeness"]) > 0


class TestOneLoanApi:
    def test_single_loan(self):
        user = _register_and_login("OneLoanApi")
        _create_loan(user, name="Home Loan", principal="5000000.00",
                      outstanding="4200000.00", emi="43391.00")

        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        assert Decimal(str(data["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("4200000.00")
        assert Decimal(str(data["debt_summary"]["total_monthly_emi"])) == Decimal("43391.00")
        assert data["debt_summary"]["active_loan_count"] == 1


class TestMultipleLoansApi:
    def test_multiple_loans(self):
        user = _register_and_login("MultiLoanApi")
        _create_loan(user, name="Home", principal="5000000.00",
                      outstanding="4200000.00", emi="43391.00")
        _create_loan(user, name="Car", principal="800000.00",
                      outstanding="650000.00", emi="16680.00")

        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        assert Decimal(str(data["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("4850000.00")
        assert Decimal(str(data["debt_summary"]["total_monthly_emi"])) == Decimal("60071.00")
        assert data["debt_summary"]["active_loan_count"] == 2


class TestCreditCardValidLimitApi:
    def test_cc_with_valid_limit(self):
        user = _register_and_login("CCLimitApi")
        _create_account(user, name="HDFC CC", atype="credit_card",
                        balance="30000.00", credit_limit="100000.00")

        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        assert Decimal(str(data["debt_summary"]["total_credit_card_debt"])) == Decimal("30000.00")
        assert Decimal(str(data["debt_summary"]["aggregate_credit_utilization"])) == Decimal("30.00")


class TestCreditCardNoLimitApi:
    def test_cc_without_limit(self):
        user = _register_and_login("CCNoLimitApi")
        _create_account(user, name="Mystery Card", atype="credit_card",
                        balance="15000.00")

        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        assert data["debt_summary"]["aggregate_credit_utilization"] is None

        # Check credit utilization indicator
        cu_ind = next(
            i for i in data["stress_indicators"] if i["metric"] == "credit_utilization"
        )
        assert cu_ind["status"] == "insufficient_data"


class TestMixedScenarioApi:
    def test_mixed_loans_cards_transactions(self):
        """Comprehensive scenario with loans, credit cards, and transactions."""
        user = _register_and_login("MixedApi")
        now = datetime.now(timezone.utc)

        acc = _create_account(user, name="Savings", balance="200000.00")
        _create_account(user, name="HDFC CC", atype="credit_card",
                        balance="25000.00", credit_limit="100000.00")
        _create_tx(user, acc["id"], "100000.00", "income", "salary", now - timedelta(days=10))
        _create_tx(user, acc["id"], "40000.00", "expense", "rent", now - timedelta(days=5))
        _create_loan(user, name="Home", principal="5000000.00",
                      outstanding="4500000.00", emi="43000.00")

        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        # Debt summary
        assert Decimal(str(data["debt_summary"]["total_outstanding_loan_principal"])) == Decimal("4500000.00")
        assert Decimal(str(data["debt_summary"]["total_monthly_emi"])) == Decimal("43000.00")
        assert data["debt_summary"]["active_loan_count"] == 1
        assert Decimal(str(data["debt_summary"]["total_credit_card_debt"])) == Decimal("25000.00")

        # Cash flow
        assert Decimal(str(data["cash_flow_pressure"]["monthly_income"])) == Decimal("100000.00")
        assert Decimal(str(data["cash_flow_pressure"]["monthly_expenses"])) == Decimal("40000.00")
        assert Decimal(str(data["cash_flow_pressure"]["monthly_emi"])) == Decimal("43000.00")

        # EMI-to-income calculated
        assert data["debt_burden_metrics"]["emi_to_income_ratio"]["status"] == "calculated"


# ---------------------------------------------------------------------------
# 4. Response Structure
# ---------------------------------------------------------------------------
class TestResponseStructure:
    def test_all_top_level_fields_present(self):
        user = _register_and_login("StructApi1")
        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        data = res.json()

        assert "user_id" in data
        assert "analysis_date" in data
        assert "start_date" in data
        assert "end_date" in data
        assert "days_in_period" in data
        assert "debt_summary" in data
        assert "cash_flow_pressure" in data
        assert "debt_burden_metrics" in data
        assert "stress_indicators" in data
        assert "data_completeness" in data

    def test_debt_summary_fields(self):
        user = _register_and_login("StructApi2")
        res = client.get(ENDPOINT, headers=user["headers"])
        data = res.json()

        ds = data["debt_summary"]
        assert "total_outstanding_loan_principal" in ds
        assert "total_monthly_emi" in ds
        assert "active_loan_count" in ds
        assert "total_credit_card_debt" in ds
        assert "total_credit_limit" in ds
        assert "aggregate_credit_utilization" in ds

    def test_cash_flow_pressure_fields(self):
        user = _register_and_login("StructApi3")
        res = client.get(ENDPOINT, headers=user["headers"])
        data = res.json()

        cf = data["cash_flow_pressure"]
        assert "monthly_income" in cf
        assert "monthly_expenses" in cf
        assert "monthly_net_cash_flow" in cf
        assert "monthly_emi" in cf
        assert "cash_flow_after_emi" in cf

    def test_debt_burden_metrics_fields(self):
        user = _register_and_login("StructApi4")
        res = client.get(ENDPOINT, headers=user["headers"])
        data = res.json()

        dbm = data["debt_burden_metrics"]
        assert "emi_to_income_ratio" in dbm
        assert "post_emi_cash_flow" in dbm
        assert "debt_service_pressure" in dbm

        # Each metric has required sub-fields
        for metric in [dbm["emi_to_income_ratio"], dbm["post_emi_cash_flow"], dbm["debt_service_pressure"]]:
            assert "name" in metric
            assert "unit" in metric
            assert "status" in metric

    def test_stress_indicators_structure(self):
        user = _register_and_login("StructApi5")
        res = client.get(ENDPOINT, headers=user["headers"])
        data = res.json()

        assert len(data["stress_indicators"]) == 4
        metrics = [i["metric"] for i in data["stress_indicators"]]
        assert "emi_burden" in metrics
        assert "cash_flow_pressure" in metrics
        assert "credit_utilization" in metrics
        assert "debt_balance" in metrics

        for ind in data["stress_indicators"]:
            assert "metric" in ind
            assert "status" in ind
            assert "explanation" in ind
            assert "benchmark" in ind

    def test_data_completeness_structure(self):
        user = _register_and_login("StructApi6")
        res = client.get(ENDPOINT, headers=user["headers"])
        data = res.json()

        assert isinstance(data["data_completeness"], list)
        for item in data["data_completeness"]:
            assert "field" in item
            assert "reason" in item


# ---------------------------------------------------------------------------
# 5. API-to-Service Consistency
# ---------------------------------------------------------------------------
class TestConsistency:
    def test_api_matches_direct_service_call(self):
        """API response must match direct DebtStressService.analyze() for the same user."""
        user = _register_and_login("ConsistApi1")
        now = datetime.now(timezone.utc)

        acc = _create_account(user, name="Main", balance="100000.00")
        _create_tx(user, acc["id"], "80000.00", "income", "salary", now - timedelta(days=5))
        _create_tx(user, acc["id"], "30000.00", "expense", "rent", now - timedelta(days=2))
        _create_loan(user, emi="15000.00")
        _create_account(user, name="CC", atype="credit_card",
                        balance="20000.00", credit_limit="100000.00")

        # Get API response
        res = client.get(ENDPOINT, headers=user["headers"])
        assert res.status_code == 200
        api_data = res.json()

        # Get direct service response
        db = TestingSessionLocal()
        try:
            service_result = DebtStressService.analyze(db, user["user_id"])
        finally:
            db.close()

        # Compare key fields
        assert Decimal(str(api_data["debt_summary"]["total_monthly_emi"])) == service_result.debt_summary.total_monthly_emi
        assert Decimal(str(api_data["debt_summary"]["total_outstanding_loan_principal"])) == service_result.debt_summary.total_outstanding_loan_principal
        assert api_data["debt_summary"]["active_loan_count"] == service_result.debt_summary.active_loan_count
        assert Decimal(str(api_data["cash_flow_pressure"]["monthly_income"])) == service_result.cash_flow_pressure.monthly_income
        assert Decimal(str(api_data["cash_flow_pressure"]["monthly_expenses"])) == service_result.cash_flow_pressure.monthly_expenses

        # Compare stress indicator statuses
        api_indicators = {i["metric"]: i["status"] for i in api_data["stress_indicators"]}
        service_indicators = {i.metric: i.status for i in service_result.stress_indicators}
        assert api_indicators == service_indicators

    def test_deterministic_repeated_api_calls(self):
        """Multiple API calls with identical state produce identical results."""
        user = _register_and_login("ConsistApi2")
        _create_loan(user, emi="10000.00")

        res1 = client.get(ENDPOINT, headers=user["headers"])
        res2 = client.get(ENDPOINT, headers=user["headers"])

        assert res1.status_code == 200
        assert res2.status_code == 200

        data1 = res1.json()
        data2 = res2.json()

        # Core fields must be identical
        assert data1["debt_summary"] == data2["debt_summary"]
        assert data1["cash_flow_pressure"] == data2["cash_flow_pressure"]
        assert data1["debt_burden_metrics"] == data2["debt_burden_metrics"]
        assert data1["stress_indicators"] == data2["stress_indicators"]


# ---------------------------------------------------------------------------
# 6. Query Parameter Tests
# ---------------------------------------------------------------------------
class TestQueryParameters:
    def test_date_range_filtering(self):
        """start_date and end_date query parameters are respected."""
        user = _register_and_login("DateApi1")
        now = datetime.now(timezone.utc)

        acc = _create_account(user, name="Main", balance="0.00")
        # Income 50 days ago (outside default 30-day window)
        _create_tx(user, acc["id"], "50000.00", "income", "salary", now - timedelta(days=50))
        # Income 5 days ago (inside default window)
        _create_tx(user, acc["id"], "10000.00", "income", "other", now - timedelta(days=5))

        # Default range (last 30 days) should only include the 10k
        res_default = client.get(ENDPOINT, headers=user["headers"])
        data_default = res_default.json()
        assert Decimal(str(data_default["cash_flow_pressure"]["monthly_income"])) == Decimal("10000.00")

        # Extended range should include both
        start = (now.date() - timedelta(days=60)).isoformat()
        end = now.date().isoformat()
        res_wide = client.get(f"{ENDPOINT}?start_date={start}&end_date={end}",
                              headers=user["headers"])
        data_wide = res_wide.json()
        assert Decimal(str(data_wide["cash_flow_pressure"]["monthly_income"])) == Decimal("60000.00")

    def test_user_id_not_from_query_params(self):
        """user_id comes from JWT, not query params — adding user_id param has no effect."""
        user_a = _register_and_login("NoQueryA")
        user_b = _register_and_login("NoQueryB")

        _create_loan(user_a, name="A Loan", principal="500000.00",
                      outstanding="400000.00", emi="12000.00")

        # User B tries to add user_id of A as query param (should be ignored)
        res = client.get(
            f"{ENDPOINT}?user_id={user_a['user_id']}",
            headers=user_b["headers"],
        )
        assert res.status_code == 200
        data = res.json()
        # User B should see their own empty data, not User A's loans
        assert data["debt_summary"]["active_loan_count"] == 0
