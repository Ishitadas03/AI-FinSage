from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

EMI_URL = "/api/v1/emi/calculate"


class TestEmiEndpointValid:
    def test_standard_home_loan_emi(self):
        """Standard home loan: 1,000,000 @ 8.5% for 240 months."""
        response = client.post(EMI_URL, json={
            "principal_amount": "1000000.00",
            "annual_interest_rate": "8.5",
            "tenure_months": 240,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["principal_amount"] == "1000000.00"
        assert data["annual_interest_rate"] == "8.5"
        assert data["tenure_months"] == 240
        assert data["monthly_emi"] == "8678.23"
        assert data["total_payment"] == "2082775.20"
        assert data["total_interest"] == "1082775.20"

    def test_zero_interest_emi(self):
        """Zero-interest loan: 120,000 @ 0% for 12 months."""
        response = client.post(EMI_URL, json={
            "principal_amount": "120000.00",
            "annual_interest_rate": "0",
            "tenure_months": 12,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["monthly_emi"] == "10000.00"
        assert data["total_payment"] == "120000.00"
        assert data["total_interest"] == "0.00"

    def test_response_structure(self):
        """Response must contain exactly the expected fields."""
        response = client.post(EMI_URL, json={
            "principal_amount": "500000",
            "annual_interest_rate": "12.0",
            "tenure_months": 36,
        })

        assert response.status_code == 200
        data = response.json()
        expected_keys = {
            "principal_amount",
            "annual_interest_rate",
            "tenure_months",
            "monthly_emi",
            "total_payment",
            "total_interest",
        }
        assert set(data.keys()) == expected_keys

    def test_decimal_precision_in_response(self):
        """Financial values must be returned as Decimal-safe strings, not floats."""
        response = client.post(EMI_URL, json={
            "principal_amount": "1000.00",
            "annual_interest_rate": "0",
            "tenure_months": 3,
        })

        assert response.status_code == 200
        data = response.json()
        # Verify Decimal-safe serialization (strings, not floats)
        emi = Decimal(str(data["monthly_emi"]))
        total = Decimal(str(data["total_payment"]))
        interest = Decimal(str(data["total_interest"]))
        assert emi == Decimal("333.33")
        assert total == Decimal("999.99")
        assert interest == Decimal("0.00")

    def test_deterministic_repeated_requests(self):
        """Identical requests must produce identical responses."""
        payload = {
            "principal_amount": "2500000.00",
            "annual_interest_rate": "7.25",
            "tenure_months": 180,
        }

        response1 = client.post(EMI_URL, json=payload)
        response2 = client.post(EMI_URL, json=payload)

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json() == response2.json()


class TestEmiEndpointNoAuth:
    def test_no_authentication_required(self):
        """EMI calculator is a public utility; no auth header needed."""
        response = client.post(
            EMI_URL,
            json={
                "principal_amount": "100000",
                "annual_interest_rate": "10",
                "tenure_months": 12,
            },
            # Deliberately no Authorization header
        )
        assert response.status_code == 200
        assert "monthly_emi" in response.json()


class TestEmiEndpointValidation:
    def test_zero_principal_rejected(self):
        response = client.post(EMI_URL, json={
            "principal_amount": "0",
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_negative_principal_rejected(self):
        response = client.post(EMI_URL, json={
            "principal_amount": "-5000",
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_negative_interest_rate_rejected(self):
        response = client.post(EMI_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "-2.5",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_zero_tenure_rejected(self):
        response = client.post(EMI_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "8.0",
            "tenure_months": 0,
        })
        assert response.status_code == 422

    def test_negative_tenure_rejected(self):
        response = client.post(EMI_URL, json={
            "principal_amount": "100000",
            "annual_interest_rate": "8.0",
            "tenure_months": -12,
        })
        assert response.status_code == 422

    def test_missing_principal_rejected(self):
        response = client.post(EMI_URL, json={
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422

    def test_missing_all_fields_rejected(self):
        response = client.post(EMI_URL, json={})
        assert response.status_code == 422

    def test_malformed_numeric_value_rejected(self):
        response = client.post(EMI_URL, json={
            "principal_amount": "not_a_number",
            "annual_interest_rate": "8.0",
            "tenure_months": 12,
        })
        assert response.status_code == 422
