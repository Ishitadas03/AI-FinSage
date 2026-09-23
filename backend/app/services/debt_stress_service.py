"""
Deterministic Debt Stress Analyzer Service (Phase 3D-5 Part 1).

Pure, deterministic service that analyzes a user's debt burden using existing
Loans, Credit Cards (Accounts), Ledger/Transactions, and Financial Health foundations.

Design rules:
- Reuses LoanService, AccountService, CreditUtilizationService.
- All financial calculations use Decimal with ROUND_HALF_UP.
- Transfers are excluded from income/expense.
- Does not invent missing financial data; returns explicit insufficient_data.
- Same database state + inputs => same result (deterministic).
- Status thresholds are FinSage product benchmarks, not universal financial truth.
"""
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.loan import Loan
from app.models.transaction import Transaction
from app.schemas.debt_stress import (
    CashFlowPressure,
    DataCompletenessItem,
    DebtBurdenMetric,
    DebtBurdenMetrics,
    DebtStressAnalysisResponse,
    DebtSummary,
    StressIndicator,
)
from app.services.account_service import AccountService
from app.services.credit_utilization_service import CreditUtilizationService


class DebtStressService:
    """Deterministic Debt Stress Analyzer Engine."""

    # -----------------------------------------------------------------------
    # FinSage product benchmark thresholds (not universal financial truth)
    # -----------------------------------------------------------------------
    _EMI_BURDEN_HEALTHY_MAX = Decimal("30.00")
    _EMI_BURDEN_ELEVATED_MAX = Decimal("50.00")

    _CASH_FLOW_HEALTHY_MIN_RATIO = Decimal("20.00")  # % of income remaining
    _CASH_FLOW_ELEVATED_MIN_RATIO = Decimal("5.00")

    _CREDIT_UTIL_HEALTHY_MAX = Decimal("30.00")
    _CREDIT_UTIL_ELEVATED_MAX = Decimal("50.00")

    _DEBT_BALANCE_HEALTHY_MAX = Decimal("200.00")  # % of monthly income
    _DEBT_BALANCE_ELEVATED_MAX = Decimal("500.00")

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------
    @staticmethod
    def analyze(
        db: Session,
        user_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> DebtStressAnalysisResponse:
        """
        Performs a complete, deterministic debt-stress analysis for the user.

        Args:
            db: SQLAlchemy session.
            user_id: Authenticated user's UUID.
            start_date: Start of transaction analysis window (inclusive). Defaults to 30 days before end_date.
            end_date: End of transaction analysis window (inclusive). Defaults to today.

        Returns:
            DebtStressAnalysisResponse with all sections populated deterministically.
        """
        today = date.today()
        if end_date is None:
            end_date = today
        if start_date is None:
            start_date = end_date - timedelta(days=29)

        days_in_period = max((end_date - start_date).days + 1, 1)

        # --- Gather raw data ---
        loans = DebtStressService._fetch_user_loans(db, user_id)
        cc_accounts = DebtStressService._fetch_credit_card_accounts(db, user_id)
        cc_balances = DebtStressService._compute_cc_balances(db, cc_accounts)
        income, expenses = DebtStressService._compute_period_cashflow(
            db, user_id, start_date, end_date
        )

        # --- A. Debt Summary ---
        debt_summary = DebtStressService._build_debt_summary(
            loans, cc_accounts, cc_balances
        )

        # --- B. Cash-Flow Pressure ---
        total_monthly_emi = debt_summary.total_monthly_emi
        cash_flow_pressure = DebtStressService._build_cash_flow_pressure(
            income, expenses, total_monthly_emi
        )

        # --- C. Debt Burden Metrics ---
        debt_burden_metrics = DebtStressService._build_debt_burden_metrics(
            income, expenses, total_monthly_emi, cash_flow_pressure.monthly_net_cash_flow
        )

        # --- D. Stress Indicators ---
        stress_indicators = DebtStressService._build_stress_indicators(
            income, expenses, total_monthly_emi,
            debt_summary, cash_flow_pressure, debt_burden_metrics
        )

        # --- E. Data Completeness ---
        data_completeness = DebtStressService._build_data_completeness(
            loans, cc_accounts, cc_balances, income, expenses, start_date, end_date
        )

        return DebtStressAnalysisResponse(
            user_id=user_id,
            analysis_date=today,
            start_date=start_date,
            end_date=end_date,
            days_in_period=days_in_period,
            debt_summary=debt_summary,
            cash_flow_pressure=cash_flow_pressure,
            debt_burden_metrics=debt_burden_metrics,
            stress_indicators=stress_indicators,
            data_completeness=data_completeness,
        )

    # -----------------------------------------------------------------------
    # Data Fetching (reusing existing patterns)
    # -----------------------------------------------------------------------
    @staticmethod
    def _fetch_user_loans(db: Session, user_id: uuid.UUID) -> List[Loan]:
        """Fetches all loans for the user (reuses the same query pattern as FinancialHealthService)."""
        return (
            db.query(Loan)
            .filter(Loan.user_id == user_id)
            .all()
        )

    @staticmethod
    def _fetch_credit_card_accounts(db: Session, user_id: uuid.UUID) -> List[Account]:
        """Fetches all credit_card accounts for the user."""
        return (
            db.query(Account)
            .filter(
                Account.user_id == user_id,
                Account.account_type == "credit_card",
            )
            .order_by(Account.created_at.asc())
            .all()
        )

    @staticmethod
    def _compute_cc_balances(
        db: Session, cc_accounts: List[Account]
    ) -> dict:
        """
        Computes dynamic outstanding balance for each credit card account.
        Reuses AccountService.calculate_account_balance.

        Returns:
            Dict mapping account.id -> outstanding_balance (Decimal).
        """
        balances = {}
        for acc in cc_accounts:
            balances[acc.id] = AccountService.calculate_account_balance(db, acc)
        return balances

    @staticmethod
    def _compute_period_cashflow(
        db: Session,
        user_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> tuple:
        """
        Computes total income and expenses for the period, excluding transfers.
        Reuses the same query pattern as FinancialHealthService / AnalyticsService.

        Returns:
            (total_income: Decimal, total_expenses: Decimal)
        """
        tx_results = (
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
            .group_by(Transaction.transaction_type)
            .all()
        )
        totals_map = {row[0]: row[1] for row in tx_results}
        total_income = totals_map.get("income", Decimal("0.00"))
        total_expenses = totals_map.get("expense", Decimal("0.00"))
        return total_income, total_expenses

    # -----------------------------------------------------------------------
    # A. Debt Summary
    # -----------------------------------------------------------------------
    @staticmethod
    def _build_debt_summary(
        loans: List[Loan],
        cc_accounts: List[Account],
        cc_balances: dict,
    ) -> DebtSummary:
        total_outstanding = sum(
            (l.outstanding_principal for l in loans), Decimal("0.00")
        )
        total_emi = sum((l.monthly_emi for l in loans), Decimal("0.00"))
        active_count = len(loans)

        # Credit card debt: only positive balances (outstanding debt)
        total_cc_debt = sum(
            (max(bal, Decimal("0.00")) for bal in cc_balances.values()),
            Decimal("0.00"),
        )

        # Total credit limit: only from cards with valid (> 0) limits
        valid_limit_cards = [
            acc for acc in cc_accounts
            if acc.credit_limit is not None and acc.credit_limit > Decimal("0.00")
        ]
        total_limit = sum(
            (acc.credit_limit for acc in valid_limit_cards), Decimal("0.00")
        )

        # Aggregate credit utilization
        if total_limit > Decimal("0.00"):
            # Only count debt from cards that have valid limits
            debt_from_valid = sum(
                (max(cc_balances.get(acc.id, Decimal("0.00")), Decimal("0.00"))
                 for acc in valid_limit_cards),
                Decimal("0.00"),
            )
            agg_util = ((debt_from_valid / total_limit) * Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            agg_util = None

        return DebtSummary(
            total_outstanding_loan_principal=total_outstanding,
            total_monthly_emi=total_emi,
            active_loan_count=active_count,
            total_credit_card_debt=total_cc_debt,
            total_credit_limit=total_limit,
            aggregate_credit_utilization=agg_util,
        )

    # -----------------------------------------------------------------------
    # B. Cash-Flow Pressure
    # -----------------------------------------------------------------------
    @staticmethod
    def _build_cash_flow_pressure(
        income: Decimal,
        expenses: Decimal,
        total_monthly_emi: Decimal,
    ) -> CashFlowPressure:
        net = income - expenses
        after_emi = income - expenses - total_monthly_emi
        return CashFlowPressure(
            monthly_income=income,
            monthly_expenses=expenses,
            monthly_net_cash_flow=net,
            monthly_emi=total_monthly_emi,
            cash_flow_after_emi=after_emi,
        )

    # -----------------------------------------------------------------------
    # C. Debt Burden Metrics
    # -----------------------------------------------------------------------
    @staticmethod
    def _build_debt_burden_metrics(
        income: Decimal,
        expenses: Decimal,
        total_monthly_emi: Decimal,
        net_cash_flow: Decimal,
    ) -> DebtBurdenMetrics:
        # C.1 EMI-to-income ratio
        if income <= Decimal("0.00"):
            emi_to_income = DebtBurdenMetric(
                name="emi_to_income_ratio",
                value=None,
                unit="%",
                status="insufficient_data",
                reason="Monthly income is zero or negative; cannot calculate EMI-to-income ratio.",
            )
        else:
            ratio = ((total_monthly_emi / income) * Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            emi_to_income = DebtBurdenMetric(
                name="emi_to_income_ratio",
                value=ratio,
                unit="%",
                status="calculated",
                reason=None,
            )

        # C.2 Post-EMI cash flow
        post_emi = income - expenses - total_monthly_emi
        post_emi_metric = DebtBurdenMetric(
            name="post_emi_cash_flow",
            value=post_emi,
            unit="INR",
            status="calculated",
            reason=None,
        )

        # C.3 Debt-service pressure: EMI / net_cash_flow * 100
        if net_cash_flow <= Decimal("0.00"):
            if total_monthly_emi > Decimal("0.00"):
                dsp = DebtBurdenMetric(
                    name="debt_service_pressure",
                    value=None,
                    unit="%",
                    status="insufficient_data",
                    reason="Net cash flow is zero or negative; debt service pressure cannot be meaningfully calculated.",
                )
            else:
                # No EMI and no positive cash flow — trivially 0
                dsp = DebtBurdenMetric(
                    name="debt_service_pressure",
                    value=Decimal("0.00"),
                    unit="%",
                    status="calculated",
                    reason=None,
                )
        else:
            ratio = ((total_monthly_emi / net_cash_flow) * Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            dsp = DebtBurdenMetric(
                name="debt_service_pressure",
                value=ratio,
                unit="%",
                status="calculated",
                reason=None,
            )

        return DebtBurdenMetrics(
            emi_to_income_ratio=emi_to_income,
            post_emi_cash_flow=post_emi_metric,
            debt_service_pressure=dsp,
        )

    # -----------------------------------------------------------------------
    # D. Stress Indicators
    # -----------------------------------------------------------------------
    @staticmethod
    def _build_stress_indicators(
        income: Decimal,
        expenses: Decimal,
        total_monthly_emi: Decimal,
        debt_summary: DebtSummary,
        cash_flow_pressure: CashFlowPressure,
        debt_burden_metrics: DebtBurdenMetrics,
    ) -> List[StressIndicator]:
        indicators: List[StressIndicator] = []

        # D.1 EMI Burden
        indicators.append(
            DebtStressService._indicator_emi_burden(debt_burden_metrics.emi_to_income_ratio)
        )

        # D.2 Cash Flow Pressure
        indicators.append(
            DebtStressService._indicator_cash_flow_pressure(income, cash_flow_pressure)
        )

        # D.3 Credit Utilization
        indicators.append(
            DebtStressService._indicator_credit_utilization(debt_summary)
        )

        # D.4 Debt Balance (total debt relative to monthly income)
        indicators.append(
            DebtStressService._indicator_debt_balance(income, debt_summary)
        )

        return indicators

    @staticmethod
    def _indicator_emi_burden(emi_metric: DebtBurdenMetric) -> StressIndicator:
        """EMI burden indicator based on EMI-to-income ratio."""
        if emi_metric.status == "insufficient_data":
            return StressIndicator(
                metric="emi_burden",
                value=None,
                unit="%",
                status="insufficient_data",
                explanation="Cannot assess EMI burden: monthly income data is unavailable or zero.",
                benchmark=f"FinSage reference: ≤ {DebtStressService._EMI_BURDEN_HEALTHY_MAX}% healthy, "
                          f"≤ {DebtStressService._EMI_BURDEN_ELEVATED_MAX}% elevated, "
                          f"> {DebtStressService._EMI_BURDEN_ELEVATED_MAX}% critical",
            )

        val = emi_metric.value
        if val <= DebtStressService._EMI_BURDEN_HEALTHY_MAX:
            status = "healthy"
            explanation = (
                f"EMI-to-income ratio of {val}% is within the healthy "
                f"≤ {DebtStressService._EMI_BURDEN_HEALTHY_MAX}% benchmark."
            )
        elif val <= DebtStressService._EMI_BURDEN_ELEVATED_MAX:
            status = "elevated"
            explanation = (
                f"EMI-to-income ratio of {val}% exceeds the healthy "
                f"{DebtStressService._EMI_BURDEN_HEALTHY_MAX}% benchmark but is within "
                f"the {DebtStressService._EMI_BURDEN_ELEVATED_MAX}% elevated threshold."
            )
        else:
            status = "critical"
            explanation = (
                f"EMI-to-income ratio of {val}% exceeds the "
                f"{DebtStressService._EMI_BURDEN_ELEVATED_MAX}% critical threshold."
            )

        return StressIndicator(
            metric="emi_burden",
            value=val,
            unit="%",
            status=status,
            explanation=explanation,
            benchmark=f"FinSage reference: ≤ {DebtStressService._EMI_BURDEN_HEALTHY_MAX}% healthy, "
                      f"≤ {DebtStressService._EMI_BURDEN_ELEVATED_MAX}% elevated, "
                      f"> {DebtStressService._EMI_BURDEN_ELEVATED_MAX}% critical",
        )

    @staticmethod
    def _indicator_cash_flow_pressure(
        income: Decimal, cash_flow: CashFlowPressure
    ) -> StressIndicator:
        """Cash flow pressure indicator based on post-EMI residual as % of income."""
        if income <= Decimal("0.00"):
            return StressIndicator(
                metric="cash_flow_pressure",
                value=None,
                unit="%",
                status="insufficient_data",
                explanation="Cannot assess cash-flow pressure: no income data available.",
                benchmark=f"FinSage reference: ≥ {DebtStressService._CASH_FLOW_HEALTHY_MIN_RATIO}% residual healthy, "
                          f"≥ {DebtStressService._CASH_FLOW_ELEVATED_MIN_RATIO}% elevated, "
                          f"< {DebtStressService._CASH_FLOW_ELEVATED_MIN_RATIO}% critical",
            )

        residual_ratio = (
            (cash_flow.cash_flow_after_emi / income) * Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if residual_ratio >= DebtStressService._CASH_FLOW_HEALTHY_MIN_RATIO:
            status = "healthy"
            explanation = (
                f"Post-EMI residual is {residual_ratio}% of income, "
                f"above the {DebtStressService._CASH_FLOW_HEALTHY_MIN_RATIO}% healthy benchmark."
            )
        elif residual_ratio >= DebtStressService._CASH_FLOW_ELEVATED_MIN_RATIO:
            status = "elevated"
            explanation = (
                f"Post-EMI residual is {residual_ratio}% of income, "
                f"below the {DebtStressService._CASH_FLOW_HEALTHY_MIN_RATIO}% healthy benchmark."
            )
        else:
            status = "critical"
            explanation = (
                f"Post-EMI residual is {residual_ratio}% of income, "
                f"below the {DebtStressService._CASH_FLOW_ELEVATED_MIN_RATIO}% critical threshold."
            )

        return StressIndicator(
            metric="cash_flow_pressure",
            value=residual_ratio,
            unit="%",
            status=status,
            explanation=explanation,
            benchmark=f"FinSage reference: ≥ {DebtStressService._CASH_FLOW_HEALTHY_MIN_RATIO}% residual healthy, "
                      f"≥ {DebtStressService._CASH_FLOW_ELEVATED_MIN_RATIO}% elevated, "
                      f"< {DebtStressService._CASH_FLOW_ELEVATED_MIN_RATIO}% critical",
        )

    @staticmethod
    def _indicator_credit_utilization(debt_summary: DebtSummary) -> StressIndicator:
        """Credit utilization indicator based on aggregate credit utilization."""
        if debt_summary.aggregate_credit_utilization is None:
            return StressIndicator(
                metric="credit_utilization",
                value=None,
                unit="%",
                status="insufficient_data",
                explanation="Cannot assess credit utilization: no credit cards with valid credit limits.",
                benchmark=f"FinSage reference: ≤ {DebtStressService._CREDIT_UTIL_HEALTHY_MAX}% healthy, "
                          f"≤ {DebtStressService._CREDIT_UTIL_ELEVATED_MAX}% elevated, "
                          f"> {DebtStressService._CREDIT_UTIL_ELEVATED_MAX}% critical",
            )

        val = debt_summary.aggregate_credit_utilization
        if val <= DebtStressService._CREDIT_UTIL_HEALTHY_MAX:
            status = "healthy"
            explanation = (
                f"Aggregate credit utilization of {val}% is within the healthy "
                f"≤ {DebtStressService._CREDIT_UTIL_HEALTHY_MAX}% benchmark."
            )
        elif val <= DebtStressService._CREDIT_UTIL_ELEVATED_MAX:
            status = "elevated"
            explanation = (
                f"Aggregate credit utilization of {val}% exceeds the healthy "
                f"{DebtStressService._CREDIT_UTIL_HEALTHY_MAX}% benchmark."
            )
        else:
            status = "critical"
            explanation = (
                f"Aggregate credit utilization of {val}% exceeds the "
                f"{DebtStressService._CREDIT_UTIL_ELEVATED_MAX}% critical threshold."
            )

        return StressIndicator(
            metric="credit_utilization",
            value=val,
            unit="%",
            status=status,
            explanation=explanation,
            benchmark=f"FinSage reference: ≤ {DebtStressService._CREDIT_UTIL_HEALTHY_MAX}% healthy, "
                      f"≤ {DebtStressService._CREDIT_UTIL_ELEVATED_MAX}% elevated, "
                      f"> {DebtStressService._CREDIT_UTIL_ELEVATED_MAX}% critical",
        )

    @staticmethod
    def _indicator_debt_balance(
        income: Decimal, debt_summary: DebtSummary
    ) -> StressIndicator:
        """
        Debt balance indicator: total debt (loans + CC) relative to monthly income.
        Formula: (total_outstanding_loan_principal + total_credit_card_debt) / monthly_income * 100
        """
        total_debt = debt_summary.total_outstanding_loan_principal + debt_summary.total_credit_card_debt

        if income <= Decimal("0.00"):
            if total_debt > Decimal("0.00"):
                return StressIndicator(
                    metric="debt_balance",
                    value=None,
                    unit="%",
                    status="insufficient_data",
                    explanation="Cannot assess debt balance ratio: no income data available, but outstanding debt exists.",
                    benchmark=f"FinSage reference: ≤ {DebtStressService._DEBT_BALANCE_HEALTHY_MAX}% healthy, "
                              f"≤ {DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% elevated, "
                              f"> {DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% critical",
                )
            else:
                return StressIndicator(
                    metric="debt_balance",
                    value=Decimal("0.00"),
                    unit="%",
                    status="healthy",
                    explanation="No outstanding debt and no income data. Debt balance ratio is 0.00%.",
                    benchmark=f"FinSage reference: ≤ {DebtStressService._DEBT_BALANCE_HEALTHY_MAX}% healthy, "
                              f"≤ {DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% elevated, "
                              f"> {DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% critical",
                )

        ratio = ((total_debt / income) * Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if ratio <= DebtStressService._DEBT_BALANCE_HEALTHY_MAX:
            status = "healthy"
            explanation = (
                f"Total debt is {ratio}% of monthly income, within the healthy "
                f"≤ {DebtStressService._DEBT_BALANCE_HEALTHY_MAX}% benchmark."
            )
        elif ratio <= DebtStressService._DEBT_BALANCE_ELEVATED_MAX:
            status = "elevated"
            explanation = (
                f"Total debt is {ratio}% of monthly income, exceeding the healthy "
                f"{DebtStressService._DEBT_BALANCE_HEALTHY_MAX}% benchmark."
            )
        else:
            status = "critical"
            explanation = (
                f"Total debt is {ratio}% of monthly income, exceeding the "
                f"{DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% critical threshold."
            )

        return StressIndicator(
            metric="debt_balance",
            value=ratio,
            unit="%",
            status=status,
            explanation=explanation,
            benchmark=f"FinSage reference: ≤ {DebtStressService._DEBT_BALANCE_HEALTHY_MAX}% healthy, "
                      f"≤ {DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% elevated, "
                      f"> {DebtStressService._DEBT_BALANCE_ELEVATED_MAX}% critical",
        )

    # -----------------------------------------------------------------------
    # E. Data Completeness
    # -----------------------------------------------------------------------
    @staticmethod
    def _build_data_completeness(
        loans: List[Loan],
        cc_accounts: List[Account],
        cc_balances: dict,
        income: Decimal,
        expenses: Decimal,
        start_date: date,
        end_date: date,
    ) -> List[DataCompletenessItem]:
        gaps: List[DataCompletenessItem] = []

        if income <= Decimal("0.00") and expenses <= Decimal("0.00"):
            gaps.append(DataCompletenessItem(
                field="transaction_history",
                reason=f"No income or expense transactions found between {start_date} and {end_date}.",
            ))
        elif income <= Decimal("0.00"):
            gaps.append(DataCompletenessItem(
                field="income_data",
                reason=f"No income transactions found between {start_date} and {end_date}. "
                       "EMI-to-income ratio and cash-flow pressure cannot be calculated.",
            ))

        if not loans:
            gaps.append(DataCompletenessItem(
                field="loan_data",
                reason="No loan records found. Loan-related metrics use zero values.",
            ))

        if not cc_accounts:
            gaps.append(DataCompletenessItem(
                field="credit_card_data",
                reason="No credit card accounts found. Credit utilization metrics cannot be calculated.",
            ))
        else:
            cards_without_limit = [
                acc for acc in cc_accounts
                if acc.credit_limit is None or acc.credit_limit <= Decimal("0.00")
            ]
            if cards_without_limit:
                names = ", ".join(acc.name for acc in cards_without_limit)
                gaps.append(DataCompletenessItem(
                    field="credit_limit",
                    reason=f"Credit limit not configured for: {names}. "
                           "These cards are excluded from utilization percentage calculations.",
                ))

        return gaps
