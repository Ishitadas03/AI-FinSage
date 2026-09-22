import pytest
from decimal import Decimal
from pydantic import ValidationError

from app.schemas.emi import EmiCalculationRequest, EmiCalculationResponse
from app.services.emi_calculator_service import EmiCalculatorService


class TestEmiCalculatorService:
    def test_normal_emi_calculation_standard_home_loan(self):
        """
        Principal: 1,000,000
        Rate: 8.5%
        Tenure: 240 months (20 years)
        r = 8.5 / 12 / 100 = 0.00708333333...
        compounded = (1+r)^240 = 5.433146...
        raw_emi = 1000000 * r * compounded / (compounded - 1) = 8678.2323... -> 8678.23
        total_payment = 8678.23 * 240 = 2082775.20
        total_interest = 2082775.20 - 1000000 = 1082775.20
        """
        result = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("1000000.00"),
            annual_interest_rate=Decimal("8.5"),
            tenure_months=240,
        )

        assert isinstance(result, EmiCalculationResponse)
        assert result.principal_amount == Decimal("1000000.00")
        assert result.annual_interest_rate == Decimal("8.5")
        assert result.tenure_months == 240
        assert result.monthly_emi == Decimal("8678.23")
        assert result.total_payment == Decimal("2082775.20")
        assert result.total_interest == Decimal("1082775.20")

    def test_normal_emi_calculation_personal_loan(self):
        """
        Principal: 500,000
        Rate: 12%
        Tenure: 36 months (3 years)
        r = 12 / 12 / 100 = 0.01
        (1 + 0.01)^36 = 1.430768783591399
        EMI = 500000 * 0.01 * 1.430768783591399 / (1.430768783591399 - 1)
            = 5000 * 1.430768783591399 / 0.430768783591399
            = 16607.1548... -> 16607.15
        total_payment = 16607.15 * 36 = 597857.40
        total_interest = 597857.40 - 500000 = 97857.40
        """
        result = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        assert result.monthly_emi == Decimal("16607.15")
        assert result.total_payment == Decimal("597857.40")
        assert result.total_interest == Decimal("97857.40")

    def test_zero_interest_calculation(self):
        """
        Principal: 120,000
        Rate: 0.0%
        Tenure: 12 months
        EMI = 120000 / 12 = 10000.00
        Total payment = 120000.00
        Total interest = 0.00
        """
        result = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("120000.00"),
            annual_interest_rate=Decimal("0.0"),
            tenure_months=12,
        )

        assert result.monthly_emi == Decimal("10000.00")
        assert result.total_payment == Decimal("120000.00")
        assert result.total_interest == Decimal("0.00")

    def test_zero_interest_with_rounding(self):
        """
        Principal: 1000.00
        Rate: 0.0%
        Tenure: 3 months
        EMI = 1000 / 3 = 333.3333... -> 333.33
        Total payment = 333.33 * 3 = 999.99
        Total interest = max(999.99 - 1000, 0.00) = 0.00
        """
        result = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("1000.00"),
            annual_interest_rate=Decimal("0"),
            tenure_months=3,
        )

        assert result.monthly_emi == Decimal("333.33")
        assert result.total_payment == Decimal("999.99")
        assert result.total_interest == Decimal("0.00")

    def test_very_small_interest_rate(self):
        """
        Principal: 100,000
        Rate: 0.01%
        Tenure: 12 months
        """
        result = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("100000"),
            annual_interest_rate=Decimal("0.01"),
            tenure_months=12,
        )

        assert result.monthly_emi > Decimal("0.00")
        assert result.total_payment >= Decimal("100000.00")
        assert result.total_interest >= Decimal("0.00")

    def test_large_principal_and_long_tenure(self):
        """
        Principal: 100,000,000.00 (100 Million)
        Rate: 9.75%
        Tenure: 360 months (30 years)
        """
        result = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("100000000.00"),
            annual_interest_rate=Decimal("9.75"),
            tenure_months=360,
        )

        assert result.monthly_emi == Decimal("859154.41")
        assert result.total_payment == Decimal("309295587.60")
        assert result.total_interest == Decimal("209295587.60")

    def test_string_and_int_inputs_accepted_and_coerced(self):
        """Service should cleanly handle string, int, and Decimal representations."""
        result = EmiCalculatorService.calculate_emi(
            principal_amount="500000",
            annual_interest_rate="12",
            tenure_months=36,
        )
        assert result.monthly_emi == Decimal("16607.15")

    def test_deterministic_repeated_calculation(self):
        """Repeated calculations must produce identically equal outputs."""
        res1 = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("2500000.00"),
            annual_interest_rate=Decimal("7.25"),
            tenure_months=180,
        )
        res2 = EmiCalculatorService.calculate_emi(
            principal_amount=Decimal("2500000.00"),
            annual_interest_rate=Decimal("7.25"),
            tenure_months=180,
        )

        assert res1.model_dump() == res2.model_dump()
        assert res1.monthly_emi == res2.monthly_emi
        assert res1.total_payment == res2.total_payment
        assert res1.total_interest == res2.total_interest

    def test_invalid_principal_zero_raises_error(self):
        with pytest.raises(ValueError, match="principal_amount must be greater than 0"):
            EmiCalculatorService.calculate_emi(
                principal_amount=Decimal("0.00"),
                annual_interest_rate=Decimal("10.0"),
                tenure_months=12,
            )

    def test_invalid_principal_negative_raises_error(self):
        with pytest.raises(ValueError, match="principal_amount must be greater than 0"):
            EmiCalculatorService.calculate_emi(
                principal_amount=Decimal("-5000.00"),
                annual_interest_rate=Decimal("10.0"),
                tenure_months=12,
            )

    def test_negative_interest_rate_raises_error(self):
        with pytest.raises(ValueError, match="annual_interest_rate cannot be negative"):
            EmiCalculatorService.calculate_emi(
                principal_amount=Decimal("100000.00"),
                annual_interest_rate=Decimal("-2.5"),
                tenure_months=12,
            )

    def test_zero_tenure_raises_error(self):
        with pytest.raises(ValueError, match="tenure_months must be greater than 0"):
            EmiCalculatorService.calculate_emi(
                principal_amount=Decimal("100000.00"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=0,
            )

    def test_negative_tenure_raises_error(self):
        with pytest.raises(ValueError, match="tenure_months must be greater than 0"):
            EmiCalculatorService.calculate_emi(
                principal_amount=Decimal("100000.00"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=-12,
            )


class TestEmiSchemas:
    def test_request_schema_valid(self):
        req = EmiCalculationRequest(
            principal_amount=Decimal("1500000.00"),
            annual_interest_rate=Decimal("8.25"),
            tenure_months=120,
        )
        assert req.principal_amount == Decimal("1500000.00")
        assert req.annual_interest_rate == Decimal("8.25")
        assert req.tenure_months == 120

    def test_request_schema_rejects_zero_principal(self):
        with pytest.raises(ValidationError):
            EmiCalculationRequest(
                principal_amount=Decimal("0.00"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=12,
            )

    def test_request_schema_rejects_negative_principal(self):
        with pytest.raises(ValidationError):
            EmiCalculationRequest(
                principal_amount=Decimal("-1000.00"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=12,
            )

    def test_request_schema_rejects_negative_interest_rate(self):
        with pytest.raises(ValidationError):
            EmiCalculationRequest(
                principal_amount=Decimal("100000.00"),
                annual_interest_rate=Decimal("-1.5"),
                tenure_months=12,
            )

    def test_request_schema_accepts_zero_interest_rate(self):
        req = EmiCalculationRequest(
            principal_amount=Decimal("100000.00"),
            annual_interest_rate=Decimal("0.0"),
            tenure_months=12,
        )
        assert req.annual_interest_rate == Decimal("0.0")

    def test_request_schema_rejects_zero_tenure(self):
        with pytest.raises(ValidationError):
            EmiCalculationRequest(
                principal_amount=Decimal("100000.00"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=0,
            )

    def test_request_schema_rejects_negative_tenure(self):
        with pytest.raises(ValidationError):
            EmiCalculationRequest(
                principal_amount=Decimal("100000.00"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=-6,
            )
