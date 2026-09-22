from decimal import Decimal, ROUND_HALF_UP
from typing import List, Union

from app.schemas.amortization import (
    AmortizationScheduleItem,
    AmortizationScheduleResponse,
)
from app.services.emi_calculator_service import EmiCalculatorService


QUANTIZE_2DP = Decimal("0.01")


class AmortizationService:
    @staticmethod
    def generate_schedule(
        principal_amount: Union[Decimal, str, int, float],
        annual_interest_rate: Union[Decimal, str, int, float],
        tenure_months: int,
    ) -> AmortizationScheduleResponse:
        """
        Generates a deterministic month-by-month amortization schedule.

        Reuses EmiCalculatorService for the EMI calculation rather than
        duplicating the formula. All arithmetic uses Decimal with
        ROUND_HALF_UP to 2 decimal places.

        The final installment is adjusted so that the closing balance is
        exactly Decimal("0.00") — no artificial residual.
        """
        # --- Delegate EMI calculation (includes input validation) ---
        emi_result = EmiCalculatorService.calculate_emi(
            principal_amount=principal_amount,
            annual_interest_rate=annual_interest_rate,
            tenure_months=tenure_months,
        )

        p = emi_result.principal_amount
        annual_rate = emi_result.annual_interest_rate
        n = emi_result.tenure_months
        monthly_emi = emi_result.monthly_emi

        # Monthly interest rate
        if annual_rate > Decimal("0.00"):
            monthly_rate = annual_rate / Decimal("12") / Decimal("100")
        else:
            monthly_rate = Decimal("0.00")

        schedule: List[AmortizationScheduleItem] = []
        opening_balance = p

        total_interest_accumulated = Decimal("0.00")
        total_principal_accumulated = Decimal("0.00")

        for month in range(1, n + 1):
            is_final_month = month == n

            # Interest for this month
            interest_component = (opening_balance * monthly_rate).quantize(
                QUANTIZE_2DP, rounding=ROUND_HALF_UP
            )

            if is_final_month:
                # Final month: reconcile to ensure closing_balance = 0.00
                principal_component = opening_balance
                emi_this_month = (interest_component + principal_component).quantize(
                    QUANTIZE_2DP, rounding=ROUND_HALF_UP
                )
                closing_balance = Decimal("0.00")
            else:
                emi_this_month = monthly_emi
                principal_component = (emi_this_month - interest_component).quantize(
                    QUANTIZE_2DP, rounding=ROUND_HALF_UP
                )
                closing_balance = (opening_balance - principal_component).quantize(
                    QUANTIZE_2DP, rounding=ROUND_HALF_UP
                )

            total_interest_accumulated += interest_component
            total_principal_accumulated += principal_component

            schedule.append(
                AmortizationScheduleItem(
                    month_number=month,
                    opening_balance=opening_balance,
                    emi=emi_this_month,
                    interest_component=interest_component,
                    principal_component=principal_component,
                    closing_balance=closing_balance,
                )
            )

            opening_balance = closing_balance

        # Compute accurate totals from the schedule itself
        total_interest = total_interest_accumulated.quantize(
            QUANTIZE_2DP, rounding=ROUND_HALF_UP
        )
        total_payment = (p + total_interest).quantize(
            QUANTIZE_2DP, rounding=ROUND_HALF_UP
        )

        return AmortizationScheduleResponse(
            principal_amount=p,
            annual_interest_rate=annual_rate,
            tenure_months=n,
            monthly_emi=monthly_emi,
            total_payment=total_payment,
            total_interest=total_interest,
            schedule=schedule,
        )
