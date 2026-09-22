from decimal import Decimal, ROUND_HALF_UP
from typing import Union
from app.schemas.emi import EmiCalculationResponse


class EmiCalculatorService:
    @staticmethod
    def calculate_emi(
        principal_amount: Union[Decimal, str, int, float],
        annual_interest_rate: Union[Decimal, str, int, float],
        tenure_months: int,
    ) -> EmiCalculationResponse:
        """
        Calculates deterministic Equated Monthly Installment (EMI), total payment,
        and total interest using precise Decimal arithmetic.

        Formula for annual_interest_rate > 0:
            monthly_rate (r) = annual_interest_rate / 12 / 100
            EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)

        Formula for annual_interest_rate == 0:
            EMI = P / n
        """
        p = Decimal(str(principal_amount))
        annual_rate = Decimal(str(annual_interest_rate))
        n = int(tenure_months)

        if p <= Decimal("0.00"):
            raise ValueError("principal_amount must be greater than 0.")
        if annual_rate < Decimal("0.00"):
            raise ValueError("annual_interest_rate cannot be negative.")
        if n <= 0:
            raise ValueError("tenure_months must be greater than 0.")

        if annual_rate == Decimal("0.00"):
            monthly_emi = (p / Decimal(str(n))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_payment = (monthly_emi * Decimal(str(n))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_interest = Decimal("0.00")
        else:
            r = annual_rate / Decimal("12") / Decimal("100")
            # Compounding factor (1 + r)^n
            compounded = (Decimal("1") + r) ** n
            numerator = p * r * compounded
            denominator = compounded - Decimal("1")

            if denominator == Decimal("0.00"):
                monthly_emi = (p / Decimal(str(n))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            else:
                raw_emi = numerator / denominator
                monthly_emi = raw_emi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            total_payment = (monthly_emi * Decimal(str(n))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_interest = (total_payment - p).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_interest = max(total_interest, Decimal("0.00"))

        return EmiCalculationResponse(
            principal_amount=p.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            annual_interest_rate=annual_rate,
            tenure_months=n,
            monthly_emi=monthly_emi,
            total_payment=total_payment,
            total_interest=total_interest,
        )
