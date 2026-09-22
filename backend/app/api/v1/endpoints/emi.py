from fastapi import APIRouter, status
from app.schemas.emi import EmiCalculationRequest, EmiCalculationResponse
from app.schemas.amortization import AmortizationRequest, AmortizationScheduleResponse
from app.services.emi_calculator_service import EmiCalculatorService
from app.services.amortization_service import AmortizationService

router = APIRouter(prefix="/emi", tags=["EMI Calculator"])


@router.post(
    "/calculate",
    response_model=EmiCalculationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Equated Monthly Installment (EMI)",
)
def calculate_emi(payload: EmiCalculationRequest):
    """
    Deterministic EMI calculator.

    Accepts principal amount, annual interest rate, and tenure in months.
    Returns monthly EMI, total payment, and total interest using precise
    Decimal arithmetic. No authentication or database access required.
    """
    return EmiCalculatorService.calculate_emi(
        principal_amount=payload.principal_amount,
        annual_interest_rate=payload.annual_interest_rate,
        tenure_months=payload.tenure_months,
    )


@router.post(
    "/amortization",
    response_model=AmortizationScheduleResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Amortization Schedule",
)
def generate_amortization_schedule(payload: AmortizationRequest):
    """
    Deterministic amortization schedule generator.

    Accepts principal amount, annual interest rate, and tenure in months.
    Returns a month-by-month amortization schedule with interest/principal
    breakdown, along with EMI, total payment, and total interest.
    No authentication or database access required.
    """
    return AmortizationService.generate_schedule(
        principal_amount=payload.principal_amount,
        annual_interest_rate=payload.annual_interest_rate,
        tenure_months=payload.tenure_months,
    )

