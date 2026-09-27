from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

AMORT_URL = "/api/v1/emi/amortization"


class TestAmortizationApiValid:
    def test_normal_interest_amortization(self):
        """500,000 @ 12% for 36 months — standard personal loan."""
        response = client.post(AMORT_URL, json={
            "principal_amount": "500000",
            "annual_interest_rate": "12.0",
            "tenure_months": 36,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["principal_amount"] == "500000.00"
        assert data["annual_interest_rate"] == "12.0"
        assert data["tenure_months"] == 36
        assert data["monthly_emi"] == "16607.15"
        assert len(data["schedule"]) == 36

    def test_zero_interest_amortization(self):
        """120,000 @ 0% for 12 months."""
        response = client.post(AMORT_URL, json={
            "principal_amount": "120000",
            "annual_interest_rate": "0",
            "tenure_months": 12,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["total_interest"] == "0.00"
        assert len(data["schedule"]) == 12

        for item in data["schedule"]:
            assert item["interest_component"] == "0.00"

    def test_one_month_tenure(self):
        """50,000 @ 10% for 1 month."""
        response = client.post(AMORT_URL, json={
            "principal_amount": "50000",
            "annual_interest_rate": "10",
            "tenure_months": 1,
        })

        assert response.status_code == 200
        data = response.json()
        assert len(data["schedule"]) == 1

        item = data["schedule"][0]
        assert item["month_number"] == 1
        assert item["opening_balance"] == "50000.00"
        assert item["closing_balance"] == "0.00"

    def test_fractional_decimal_values(self):
        """999999.99 @ 11.11% for 120 months — fractional inputs."""
        response = client.post(AMORT_URL, json={
            "principal_amount": "999999.99",
            "annual_interest_rate": "11.11",
            "tenure_months": 120,
        })

        assert response.status_code == 200
        data = response.json()
        assert len(data["schedule"]) == 120

        # Final closing balance must be exactly 0.00
        assert data["schedule"][-1]["closing_balance"] == "0.00"

    def test_final_closing_balance_exactly_zero(self):
        """Verify final closing_balance == 0.00 for multiple scenarios via API."""
        test_cases = [
            {"principal_amount": "100000", "annual_interest_rate": "8.5", "tenure_months": 60},
            {"principal_amount": "1000", "annual_interest_rate": "0", "tenure_months": 3},
            {"principal_amount": "250000", "annual_interest_rate": "15.0", "tenure_months": 48},
        ]

        for payload in test_cases:
            response = client.post(AMORT_URL, json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["schedule"][-1]["closing_balance"] == "0.00", (
                f"Failed for payload={payload}"
            )

    def test_schedule_length_equals_tenure(self):
        """Schedule must have exactly tenure_months items."""
        for tenure in [6, 12, 60, 240]:
            response = client.post(AMORT_URL, json={
                "principal_amount": "100000",
                "annual_interest_rate": "10",
                "tenure_months": tenure,
            })

            assert response.status_code == 200
            assert len(response.json()["schedule"]) == tenure

    def test_api_totals_match_schedule_sums(self):
        """total_interest and principal sums from schedule must reconcile."""
        response = client.post(AMORT_URL, json={
            "principal_amount": "500000",
            "annual_interest_rate": "12.0",
            "tenure_months": 36,
        })

        assert response.status_code == 200
        data = response.json()
        schedule = data["schedule"]

        sum_principal = sum(Decimal(item["principal_component"]) for item in schedule)
        sum_interest = sum(Decimal(item["interest_component"]) for item in schedule)

        assert sum_principal.quantize(Decimal("0.01")) == Decimal(data["principal_amount"])
        assert sum_interest.quantize(Decimal("0.01")) == Decimal(data["total_interest"])

    def test_response_structure(self):
        """Response must contain all expected top-level and schedule-item keys."""
        response = client.post(AMORT_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "10",
            "tenure_months": 12,
        })

        assert response.status_code == 200
        data = response.json()

        top_keys = {"principal_amount", "annual_interest_rate", "tenure_months",
                     "monthly_emi", "total_payment", "total_interest", "schedule"}
        assert set(data.keys()) == top_keys

        item_keys = {"month_number", "opening_balance", "emi",
                      "interest_component", "principal_component", "closing_balance"}
        for item in data["schedule"]:
            assert set(item.keys()) == item_keys

    def test_deterministic_repeated_requests(self):
        """Identical requests must produce identical responses."""
        payload = {
            "principal_amount": "2500000",
            "annual_interest_rate": "7.25",
            "tenure_months": 180,
        }

        r1 = client.post(AMORT_URL, json=payload)
        r2 = client.post(AMORT_URL, json=payload)

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json() == r2.json()


class TestAmortizationApiNoAuth:
    def test_no_authentication_required(self):
        """Amortization endpoint is a public utility — no auth header needed."""
        response = client.post(
            AMORT_URL,
            json={
                "principal_amount": "100000",
                "annual_interest_rate": "10",
                "tenure_months": 12,
            },
        )
        assert response.status_code == 200
        assert "schedule" in response.json()


class TestAmortizationApiValidation:
    def test_zero_principal_rejected(self):
        response = client.post(AMORT_URL, json={
            "principal_amount": "0",
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_negative_principal_rejected(self):
        response = client.post(AMORT_URL, json={
            "principal_amount": "-5000",
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_negative_interest_rate_rejected(self):
        response = client.post(AMORT_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "-2.5",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_zero_tenure_rejected(self):
        response = client.post(AMORT_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "8.0",
            "tenure_months": 0,
        })
        assert response.status_code == 422

    def test_negative_tenure_rejected(self):
        response = client.post(AMORT_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "8.0",
            "tenure_months": -12,
        })
        assert response.status_code == 422

    def test_missing_fields_rejected(self):
        response = client.post(AMORT_URL, json={})
        assert response.status_code == 422

    def test_malformed_numeric_rejected(self):
        response = client.post(AMORT_URL, json={
            "principal_amount": "not_a_number",
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_amortization_schedule_alias_endpoint(self):
        """Verify that /api/v1/emi/amortization-schedule alias responds identically."""
        alias_url = "/api/v1/emi/amortization-schedule"
        payload = {
            "principal_amount": "300000",
            "annual_interest_rate": "9.5",
            "tenure_months": 24,
        }
        res_alias = client.post(alias_url, json=payload)
        res_main = client.post(AMORT_URL, json=payload)

        assert res_alias.status_code == 200
        assert res_main.status_code == 200
        assert res_alias.json() == res_main.json()

