from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.loan import Loan
from app.models.transaction import Transaction
from app.schemas.financial_health import (
    FinancialHealthOverviewResponse,
    HealthMetricItem,
)
from app.services.account_service import AccountService
from app.services.credit_utilization_service import CreditUtilizationService
from app.services.debt_stress_service import DebtStressService


class FinancialHealthService:
    @staticmethod
    def get_financial_health_overview(
        db: Session,
        user_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[uuid.UUID] = None,
    ) -> FinancialHealthOverviewResponse:
        """
        Calculates deterministic financial health metrics grounded strictly in verified
        ledger account balances, active loans, and historical transactions.

        No AI, no ML, and no arbitrary composite scores.
        """
        today = date.today()
        if end_date is None:
            end_date = today
        if start_date is None:
            # Default to last 30 days window
            start_date = end_date - timedelta(days=29)

        days_in_period = max((end_date - start_date).days + 1, 1)

        # 1. Fetch User Accounts and calculate current dynamic balances
        all_accounts = AccountService.list_user_accounts(db, user_id)

        # If account_id filter is requested, verify ownership and filter accounts
        if account_id:
            filtered_accounts = [acc for acc in all_accounts if acc.id == account_id]
        else:
            filtered_accounts = all_accounts

        liquid_assets = Decimal("0.00")
        credit_card_debt = Decimal("0.00")
        investment_assets = Decimal("0.00")
        total_assets = Decimal("0.00")

        for acc in filtered_accounts:
            bal = acc.current_balance
            if acc.account_type in ["savings", "current", "cash"]:
                if bal > Decimal("0.00"):
                    liquid_assets += bal
                total_assets += max(bal, Decimal("0.00"))
            elif acc.account_type == "credit_card":
                if bal > Decimal("0.00"):
                    credit_card_debt += bal
            elif acc.account_type == "investment":
                if bal > Decimal("0.00"):
                    investment_assets += bal
                total_assets += max(bal, Decimal("0.00"))
            else:  # other
                total_assets += max(bal, Decimal("0.00"))

        # 2. Query Transaction totals for the period (excluding transfers to avoid double-counting)
        tx_query = (
            db.query(
                Transaction.transaction_type,
                func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label("total"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.transaction_type.in_(["income", "expense"]),
            )
        )

        if account_id:
            tx_query = tx_query.filter(Transaction.account_id == account_id)

        tx_results = tx_query.group_by(Transaction.transaction_type).all()
        totals_map = {row[0]: row[1] for row in tx_results}

        total_income = totals_map.get("income", Decimal("0.00"))
        total_expenses = totals_map.get("expense", Decimal("0.00"))
        net_cashflow = total_income - total_expenses

        # 3. Calculate Deterministic Foundation Metrics
        savings_rate = FinancialHealthService._calculate_savings_rate(total_income, total_expenses)
        expense_ratio = FinancialHealthService._calculate_expense_ratio(total_income, total_expenses)
        emergency_fund_coverage = FinancialHealthService._calculate_emergency_fund_coverage(
            liquid_assets, total_expenses, days_in_period
        )
        debt_to_liquid = FinancialHealthService._calculate_debt_to_liquid_ratio(
            credit_card_debt, liquid_assets
        )
        investment_allocation = FinancialHealthService._calculate_investment_allocation(
            investment_assets, total_assets
        )

        # 4. Integrate Credit Card Utilization via CreditUtilizationService
        util_response = CreditUtilizationService.get_user_credit_utilization(db, user_id)
        credit_card_utilization_metric = HealthMetricItem(
            value=util_response.aggregate.utilization_percentage,
            unit="%",
            status=util_response.aggregate.status,
            benchmark="≤ 30.00% of available credit limit",
            explanation=util_response.aggregate.explanation,
        )

        # 5. Integrate Loan / Debt Summary
        user_loans = (
            db.query(Loan)
            .filter(Loan.user_id == user_id)
            .all()
        )
        total_outstanding_loan_principal = sum(
            (l.outstanding_principal for l in user_loans),
            Decimal("0.00"),
        )
        total_monthly_emi = sum(
            (l.monthly_emi for l in user_loans),
            Decimal("0.00"),
        )
        active_loan_count = len(user_loans)

        # 6. DTI Metric: remains insufficient_data (reliable gross monthly income not in ledger)
        debt_to_income_metric = HealthMetricItem(
            value=None,
            unit="%",
            status="insufficient_data",
            benchmark="≤ 36.00% of gross monthly income (≤ 43.00% maximum threshold)",
            explanation="Reliable gross income data is not available to compute Debt-to-Income (DTI).",
        )

        # Diagnostic metadata notes
        data_completeness_notes = [
            "Debt-to-Income (DTI) metric requires verified gross monthly income profile (not currently available in transaction ledger).",
            "Credit Card Utilization metric requires credit limit configuration on all credit accounts.",
            "Essential vs. Discretionary spending breakdown requires category classification taxonomy.",
        ]

        # 7. Integrate Debt Stress Analysis via DebtStressService
        debt_stress = DebtStressService.analyze(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
        )

        return FinancialHealthOverviewResponse(
            start_date=start_date,
            end_date=end_date,
            days_in_period=days_in_period,
            liquid_assets=liquid_assets,
            credit_card_debt=credit_card_debt,
            investment_assets=investment_assets,
            total_assets=total_assets,
            total_income=total_income,
            total_expenses=total_expenses,
            net_cashflow=net_cashflow,
            total_outstanding_loan_principal=total_outstanding_loan_principal,
            total_monthly_emi=total_monthly_emi,
            active_loan_count=active_loan_count,
            savings_rate=savings_rate,
            expense_ratio=expense_ratio,
            emergency_fund_coverage_months=emergency_fund_coverage,
            debt_to_liquid_ratio=debt_to_liquid,
            investment_allocation_ratio=investment_allocation,
            credit_card_utilization=credit_card_utilization_metric,
            debt_to_income_ratio=debt_to_income_metric,
            credit_card_details=util_response.cards,
            data_completeness_notes=data_completeness_notes,
            debt_stress=debt_stress,
        )

    @staticmethod
    def _calculate_savings_rate(income: Decimal, expenses: Decimal) -> HealthMetricItem:
        if income <= Decimal("0.00"):
            return HealthMetricItem(
                value=Decimal("0.00"),
                unit="%",
                status="insufficient_data",
                benchmark="≥ 20.00% of income saved",
                explanation="No recorded income in the selected period to calculate savings rate.",
            )

        savings = income - expenses
        rate = ((savings / income) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if rate < Decimal("0.00"):
            status = "critical"
            explanation = f"Expenses exceeded income by {abs(savings):,.2f} INR (negative cash flow of {rate:.2f}%)."
        elif rate < Decimal("20.00"):
            status = "moderate"
            explanation = f"Saving {rate:.2f}% of income. Target benchmark is ≥ 20.00%."
        else:
            status = "healthy"
            explanation = f"Excellent savings rate of {rate:.2f}% (meeting or exceeding the ≥ 20.00% benchmark)."

        return HealthMetricItem(
            value=rate,
            unit="%",
            status=status,
            benchmark="≥ 20.00% of income saved",
            explanation=explanation,
        )

    @staticmethod
    def _calculate_expense_ratio(income: Decimal, expenses: Decimal) -> HealthMetricItem:
        if income <= Decimal("0.00"):
            return HealthMetricItem(
                value=None,
                unit="%",
                status="insufficient_data",
                benchmark="≤ 50.00% of income spent",
                explanation="No recorded income in the selected period to calculate expense ratio.",
            )

        ratio = ((expenses / income) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if ratio <= Decimal("50.00"):
            status = "healthy"
            explanation = f"Expenses represent {ratio:.2f}% of total income (within standard 50.00% needs/expenses guideline)."
        elif ratio <= Decimal("80.00"):
            status = "moderate"
            explanation = f"Expenses represent {ratio:.2f}% of total income (approaching higher expenditure threshold)."
        else:
            status = "critical"
            explanation = f"High expense burn: {ratio:.2f}% of total income spent in this period."

        return HealthMetricItem(
            value=ratio,
            unit="%",
            status=status,
            benchmark="≤ 50.00% of income spent",
            explanation=explanation,
        )

    @staticmethod
    def _calculate_emergency_fund_coverage(
        liquid_assets: Decimal, expenses: Decimal, days_in_period: int
    ) -> HealthMetricItem:
        if expenses <= Decimal("0.00"):
            return HealthMetricItem(
                value=None,
                unit="months",
                status="insufficient_data",
                benchmark="3.00 to 6.00 months of basic living expenses",
                explanation="No recorded expenses in this period to establish a monthly baseline expense rate.",
            )

        daily_expense_rate = expenses / Decimal(days_in_period)
        monthly_expense_rate = daily_expense_rate * Decimal("30")

        if monthly_expense_rate <= Decimal("0.00"):
            return HealthMetricItem(
                value=None,
                unit="months",
                status="insufficient_data",
                benchmark="3.00 to 6.00 months of basic living expenses",
                explanation="Calculated monthly expense rate is zero.",
            )

        months = (liquid_assets / monthly_expense_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if months < Decimal("3.00"):
            status = "critical"
            explanation = f"Liquid buffer covers {months:.2f} months of expenses. Recommended emergency runway is 3.00 to 6.00 months."
        elif months <= Decimal("6.00"):
            status = "moderate"
            explanation = f"Liquid buffer covers {months:.2f} months of expenses (meets basic 3.00 to 6.00 months runway)."
        else:
            status = "healthy"
            explanation = f"Strong emergency runway: {months:.2f} months of expenses covered by liquid assets."

        return HealthMetricItem(
            value=months,
            unit="months",
            status=status,
            benchmark="3.00 to 6.00 months of basic living expenses",
            explanation=explanation,
        )

    @staticmethod
    def _calculate_debt_to_liquid_ratio(
        credit_card_debt: Decimal, liquid_assets: Decimal
    ) -> HealthMetricItem:
        if credit_card_debt == Decimal("0.00"):
            return HealthMetricItem(
                value=Decimal("0.00"),
                unit="%",
                status="healthy",
                benchmark="≤ 30.00% of liquid assets",
                explanation="Zero outstanding credit card debt.",
            )

        if liquid_assets <= Decimal("0.00"):
            return HealthMetricItem(
                value=None,
                unit="%",
                status="critical",
                benchmark="≤ 30.00% of liquid assets",
                explanation=f"Outstanding credit card debt of {credit_card_debt:,.2f} INR with zero or negative liquid assets.",
            )

        ratio = ((credit_card_debt / liquid_assets) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if ratio <= Decimal("30.00"):
            status = "healthy"
            explanation = f"Credit card debt is {ratio:.2f}% of liquid assets (comfortably payable with liquid reserves)."
        elif ratio <= Decimal("70.00"):
            status = "moderate"
            explanation = f"Credit card debt is {ratio:.2f}% of liquid assets (monitor debt payoff against liquid reserves)."
        else:
            status = "critical"
            explanation = f"Elevated credit card debt ({ratio:.2f}% of total liquid assets)."

        return HealthMetricItem(
            value=ratio,
            unit="%",
            status=status,
            benchmark="≤ 30.00% of liquid assets",
            explanation=explanation,
        )

    @staticmethod
    def _calculate_investment_allocation(
        investment_assets: Decimal, total_assets: Decimal
    ) -> HealthMetricItem:
        if total_assets <= Decimal("0.00"):
            return HealthMetricItem(
                value=Decimal("0.00") if investment_assets == Decimal("0.00") else None,
                unit="%",
                status="insufficient_data",
                benchmark="≥ 20.00% of asset portfolio in growth/wealth assets",
                explanation="Total asset base is zero or not established.",
            )

        ratio = ((investment_assets / total_assets) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if ratio == Decimal("0.00"):
            status = "moderate"
            explanation = "No active investments allocated in asset portfolio."
        elif ratio < Decimal("20.00"):
            status = "moderate"
            explanation = f"Investments make up {ratio:.2f}% of total assets (below recommended ≥ 20.00% wealth allocation)."
        else:
            status = "healthy"
            explanation = f"Investments make up {ratio:.2f}% of total assets (meeting or exceeding wealth allocation target)."

        return HealthMetricItem(
            value=ratio,
            unit="%",
            status=status,
            benchmark="≥ 20.00% of asset portfolio in growth/wealth assets",
            explanation=explanation,
        )
