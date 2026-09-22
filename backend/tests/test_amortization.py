import pytest
import math
from decimal import Decimal
from pydantic import ValidationError

from app.schemas.amortization import (
    AmortizationRequest,
    AmortizationScheduleItem,
    AmortizationScheduleResponse,
)
from app.services.amortization_service import AmortizationService


ZERO = Decimal("0.00")


# ─── Helper assertions ───────────────────────────────────────────────

def assert_schedule_accounting(result: AmortizationScheduleResponse):
    """Run all standard accounting invariants on an amortization result."""
    schedule = result.schedule
    n = result.tenure_months

    # Length and sequential month numbers
    assert len(schedule) == n
    for i, item in enumerate(schedule, start=1):
        assert item.month_number == i

    # First opening balance equals principal
    assert schedule[0].opening_balance == result.principal_amount

    # Each month: opening - principal_component == closing  (except final)
    for item in schedule[:-1]:
        expected_closing = (item.opening_balance - item.principal_component).quantize(Decimal("0.01"))
        assert item.closing_balance == expected_closing

    # Chained progression: this month's closing == next month's opening
    for i in range(len(schedule) - 1):
        assert schedule[i].closing_balance == schedule[i + 1].opening_balance

    # Final closing balance must be exactly 0.00
    assert schedule[-1].closing_balance == ZERO

    # No negative balances
    for item in schedule:
        assert item.opening_balance >= ZERO
        assert item.closing_balance >= ZERO

    # Principal components sum to original principal
    sum_principal = sum(item.principal_component for item in schedule)
    assert sum_principal.quantize(Decimal("0.01")) == result.principal_amount

    # Interest components sum to total_interest
    sum_interest = sum(item.interest_component for item in schedule)
    assert sum_interest.quantize(Decimal("0.01")) == result.total_interest

    # No NaN/Infinity in any field
    for item in schedule:
        for field_name in ("opening_balance", "emi", "interest_component", "principal_component", "closing_balance"):
            val = getattr(item, field_name)
            assert not math.isnan(float(val))
            assert not math.isinf(float(val))


# ═══════════════════════════════════════════════════════════════════════
# Standard Loan Schedules
# ═══════════════════════════════════════════════════════════════════════

class TestAmortizationStandardLoans:
    def test_personal_loan_schedule(self):
        """500,000 @ 12% for 36 months — full accounting check."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        assert isinstance(result, AmortizationScheduleResponse)
        assert result.principal_amount == Decimal("500000.00")
        assert result.annual_interest_rate == Decimal("12.0")
        assert result.tenure_months == 36
        assert result.monthly_emi == Decimal("16607.15")
        assert_schedule_accounting(result)

    def test_home_loan_schedule(self):
        """1,000,000 @ 8.5% for 240 months — full accounting check."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("1000000"),
            annual_interest_rate=Decimal("8.5"),
            tenure_months=240,
        )

        assert result.monthly_emi == Decimal("8678.23")
        assert len(result.schedule) == 240
        assert_schedule_accounting(result)

    def test_first_month_interest_calculation(self):
        """
        500,000 @ 12% -> monthly_rate = 0.01
        First month interest = 500000 * 0.01 = 5000.00
        """
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        first = result.schedule[0]
        assert first.opening_balance == Decimal("500000.00")
        assert first.interest_component == Decimal("5000.00")

    def test_first_month_principal_component(self):
        """
        EMI = 16607.15, Interest = 5000.00
        Principal = 16607.15 - 5000.00 = 11607.15
        """
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        first = result.schedule[0]
        assert first.principal_component == Decimal("11607.15")
        assert first.emi == Decimal("16607.15")

    def test_opening_closing_balance_progression(self):
        """Balances must decrease monotonically for a standard amortizing loan."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        for i in range(len(result.schedule) - 1):
            assert result.schedule[i].closing_balance > result.schedule[i + 1].closing_balance

    def test_emi_equals_interest_plus_principal_each_month(self):
        """For every installment, emi == interest_component + principal_component."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        for item in result.schedule:
            assert item.emi == (item.interest_component + item.principal_component).quantize(Decimal("0.01"))


# ═══════════════════════════════════════════════════════════════════════
# Zero Interest
# ═══════════════════════════════════════════════════════════════════════

class TestAmortizationZeroInterest:
    def test_zero_interest_schedule(self):
        """120,000 @ 0% for 12 months — every interest component should be 0."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("120000"),
            annual_interest_rate=Decimal("0"),
            tenure_months=12,
        )

        assert result.monthly_emi == Decimal("10000.00")
        assert result.total_interest == ZERO
        assert len(result.schedule) == 12

        for item in result.schedule:
            assert item.interest_component == ZERO
            assert item.principal_component == Decimal("10000.00")

        assert_schedule_accounting(result)

    def test_zero_interest_with_rounding(self):
        """
        1000 @ 0% for 3 months -> EMI = 333.33.
        Final month must reconcile to exactly 0.00.
        """
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("1000"),
            annual_interest_rate=Decimal("0"),
            tenure_months=3,
        )

        assert result.monthly_emi == Decimal("333.33")
        assert result.schedule[-1].closing_balance == ZERO
        assert_schedule_accounting(result)


# ═══════════════════════════════════════════════════════════════════════
# Edge Cases
# ═══════════════════════════════════════════════════════════════════════

class TestAmortizationEdgeCases:
    def test_very_small_interest_rate(self):
        """100,000 @ 0.01% for 12 months."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("100000"),
            annual_interest_rate=Decimal("0.01"),
            tenure_months=12,
        )

        assert_schedule_accounting(result)
        assert result.total_interest >= ZERO

    def test_large_principal_long_tenure(self):
        """100,000,000 @ 9.75% for 360 months."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("100000000"),
            annual_interest_rate=Decimal("9.75"),
            tenure_months=360,
        )

        assert len(result.schedule) == 360
        assert result.schedule[0].opening_balance == Decimal("100000000.00")
        assert result.schedule[-1].closing_balance == ZERO
        assert_schedule_accounting(result)

    def test_short_tenure_single_month(self):
        """50,000 @ 10% for 1 month."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("50000"),
            annual_interest_rate=Decimal("10"),
            tenure_months=1,
        )

        assert len(result.schedule) == 1
        item = result.schedule[0]
        assert item.month_number == 1
        assert item.opening_balance == Decimal("50000.00")
        assert item.closing_balance == ZERO
        assert_schedule_accounting(result)

    def test_short_tenure_two_months(self):
        """50,000 @ 12% for 2 months."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("50000"),
            annual_interest_rate=Decimal("12"),
            tenure_months=2,
        )

        assert len(result.schedule) == 2
        assert result.schedule[-1].closing_balance == ZERO
        assert_schedule_accounting(result)

    def test_final_balance_exactly_zero(self):
        """Explicitly verify final closing_balance == 0.00 for multiple scenarios."""
        test_cases = [
            (Decimal("100000"), Decimal("8.5"), 60),
            (Decimal("250000"), Decimal("15.0"), 48),
            (Decimal("1000"), Decimal("0"), 7),
            (Decimal("999999.99"), Decimal("11.11"), 120),
        ]

        for principal, rate, tenure in test_cases:
            result = AmortizationService.generate_schedule(
                principal_amount=principal,
                annual_interest_rate=rate,
                tenure_months=tenure,
            )
            assert result.schedule[-1].closing_balance == ZERO, (
                f"Failed for principal={principal}, rate={rate}, tenure={tenure}"
            )

    def test_no_negative_balance_anywhere(self):
        """No installment should produce a negative opening or closing balance."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        for item in result.schedule:
            assert item.opening_balance >= ZERO
            assert item.closing_balance >= ZERO
            assert item.principal_component >= ZERO
            assert item.interest_component >= ZERO

    def test_no_nan_or_infinity(self):
        """No NaN or Infinity values in the schedule."""
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("500000"),
            annual_interest_rate=Decimal("12.0"),
            tenure_months=36,
        )

        for item in result.schedule:
            for field in ("opening_balance", "emi", "interest_component", "principal_component", "closing_balance"):
                val = float(getattr(item, field))
                assert not math.isnan(val)
                assert not math.isinf(val)

    def test_final_rounding_adjustment(self):
        """
        The final month's EMI may differ from the regular EMI to reconcile
        the remaining balance. Verify the adjustment is correct.
        """
        result = AmortizationService.generate_schedule(
            principal_amount=Decimal("1000"),
            annual_interest_rate=Decimal("0"),
            tenure_months=3,
        )

        # Regular EMI is 333.33, but 333.33 * 3 = 999.99, not 1000.
        # The final month should adjust to cover the remaining 333.34.
        final = result.schedule[-1]
        assert final.closing_balance == ZERO
        # Principal component of last month reconciles the remaining balance
        assert final.principal_component == result.schedule[-1].opening_balance


# ═══════════════════════════════════════════════════════════════════════
# Determinism
# ═══════════════════════════════════════════════════════════════════════

class TestAmortizationDeterminism:
    def test_deterministic_repeated_calculation(self):
        """Repeated calls must produce identical schedules."""
        kwargs = dict(
            principal_amount=Decimal("2500000"),
            annual_interest_rate=Decimal("7.25"),
            tenure_months=180,
        )

        res1 = AmortizationService.generate_schedule(**kwargs)
        res2 = AmortizationService.generate_schedule(**kwargs)

        assert res1.model_dump() == res2.model_dump()


# ═══════════════════════════════════════════════════════════════════════
# Input Validation
# ═══════════════════════════════════════════════════════════════════════

class TestAmortizationInputValidation:
    def test_invalid_principal_zero(self):
        with pytest.raises(ValueError, match="principal_amount must be greater than 0"):
            AmortizationService.generate_schedule(
                principal_amount=Decimal("0"),
                annual_interest_rate=Decimal("10"),
                tenure_months=12,
            )

    def test_invalid_principal_negative(self):
        with pytest.raises(ValueError, match="principal_amount must be greater than 0"):
            AmortizationService.generate_schedule(
                principal_amount=Decimal("-5000"),
                annual_interest_rate=Decimal("10"),
                tenure_months=12,
            )

    def test_negative_interest_rate(self):
        with pytest.raises(ValueError, match="annual_interest_rate cannot be negative"):
            AmortizationService.generate_schedule(
                principal_amount=Decimal("100000"),
                annual_interest_rate=Decimal("-2.5"),
                tenure_months=12,
            )

    def test_zero_tenure(self):
        with pytest.raises(ValueError, match="tenure_months must be greater than 0"):
            AmortizationService.generate_schedule(
                principal_amount=Decimal("100000"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=0,
            )

    def test_negative_tenure(self):
        with pytest.raises(ValueError, match="tenure_months must be greater than 0"):
            AmortizationService.generate_schedule(
                principal_amount=Decimal("100000"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=-12,
            )


# ═══════════════════════════════════════════════════════════════════════
# Schema Validation
# ═══════════════════════════════════════════════════════════════════════

class TestAmortizationSchemas:
    def test_request_schema_valid(self):
        req = AmortizationRequest(
            principal_amount=Decimal("1500000.00"),
            annual_interest_rate=Decimal("8.25"),
            tenure_months=120,
        )
        assert req.principal_amount == Decimal("1500000.00")

    def test_request_schema_rejects_zero_principal(self):
        with pytest.raises(ValidationError):
            AmortizationRequest(
                principal_amount=Decimal("0"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=12,
            )

    def test_request_schema_rejects_negative_interest(self):
        with pytest.raises(ValidationError):
            AmortizationRequest(
                principal_amount=Decimal("100000"),
                annual_interest_rate=Decimal("-1.0"),
                tenure_months=12,
            )

    def test_request_schema_rejects_zero_tenure(self):
        with pytest.raises(ValidationError):
            AmortizationRequest(
                principal_amount=Decimal("100000"),
                annual_interest_rate=Decimal("8.0"),
                tenure_months=0,
            )
