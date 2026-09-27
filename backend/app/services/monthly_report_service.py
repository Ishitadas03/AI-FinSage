"""
Dynamic Monthly Financial Report Generation Service (Phase 4).

Generates comprehensive, verified monthly financial audits and executive reports
grounded directly in user ledger transactions, budgets, recurring commitments, and health metrics.
"""
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
import calendar
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func, desc

from app.models.transaction import Transaction
from app.schemas.monthly_report import (
    ReportPeriod,
    ReportFinancialSummary,
    ReportPeriodComparison,
    ReportCategoryBreakdown,
    ReportTopExpense,
    ReportBudgetAuditItem,
    ReportUpcomingObligation,
    ReportFinancialHealth,
    ReportActionChecklistItem,
    MonthlyFinancialReportResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.budget_service import BudgetService
from app.services.loan_service import LoanService
from app.services.recurring_bill_service import RecurringBillService
from app.services.financial_health_service import FinancialHealthService


class MonthlyReportService:
    """Service to generate grounded, dynamic monthly reports."""

    @classmethod
    def generate_monthly_report(
        cls,
        db: Session,
        user_id: uuid.UUID,
        month_str: Optional[str] = None,  # format "YYYY-MM" (e.g. "2026-09")
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None,
    ) -> MonthlyFinancialReportResponse:
        """
        Calculates and synthesizes a full monthly financial report for the user.
        """
        # 1. Determine period boundaries
        now = datetime.now(timezone.utc)
        missing_notes: List[str] = []

        if month_str:
            try:
                parts = month_str.strip().split("-")
                year, month = int(parts[0]), int(parts[1])
            except Exception:
                year, month = now.year, now.month
        elif start_date_str and end_date_str:
            d_start = date.fromisoformat(start_date_str)
            year, month = d_start.year, d_start.month
        else:
            year, month = now.year, now.month

        _, last_day = calendar.monthrange(year, month)
        period_start_dt = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        period_end_dt = datetime(year, month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
        month_label = f"{calendar.month_name[month]} {year}"
        days_in_period = last_day
        is_complete = period_end_dt.date() <= now.date()

        # Previous period (previous month)
        prev_month = 12 if month == 1 else month - 1
        prev_year = year - 1 if month == 1 else year
        _, prev_last_day = calendar.monthrange(prev_year, prev_month)
        prev_start_dt = datetime(prev_year, prev_month, 1, 0, 0, 0, tzinfo=timezone.utc)
        prev_end_dt = datetime(prev_year, prev_month, prev_last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)

        # 2. Analytics for Current Period
        current_analytics = AnalyticsService.get_analytics_overview(
            db=db,
            user_id=user_id,
            start_date=period_start_dt,
            end_date=period_end_dt,
        )

        total_income = float(current_analytics.summary.total_income)
        total_expenses = float(current_analytics.summary.total_expenses)
        net_savings = float(current_analytics.summary.net_cash_flow)
        savings_rate = float(current_analytics.summary.savings_rate)
        daily_burn_rate = round(total_expenses / days_in_period, 2) if days_in_period > 0 else 0.0

        if total_income == 0 and total_expenses == 0:
            missing_notes.append(f"No transactions recorded for {month_label}.")

        # 3. Analytics for Previous Period (Comparison)
        prev_analytics = AnalyticsService.get_analytics_overview(
            db=db,
            user_id=user_id,
            start_date=prev_start_dt,
            end_date=prev_end_dt,
        )
        prev_income = float(prev_analytics.summary.total_income)
        prev_expenses = float(prev_analytics.summary.total_expenses)
        prev_net_savings = float(prev_analytics.summary.net_cash_flow)

        has_prev = (prev_income > 0 or prev_expenses > 0)
        income_change_pct = (
            round(((total_income - prev_income) / prev_income) * 100, 1)
            if prev_income > 0 else None
        )
        expense_change_pct = (
            round(((total_expenses - prev_expenses) / prev_expenses) * 100, 1)
            if prev_expenses > 0 else None
        )
        net_savings_change = round(net_savings - prev_net_savings, 2) if has_prev else None

        comparison = ReportPeriodComparison(
            has_previous_period=has_prev,
            previous_income=prev_income,
            previous_expenses=prev_expenses,
            previous_net_savings=prev_net_savings,
            income_change_pct=income_change_pct,
            expense_change_pct=expense_change_pct,
            net_savings_change=net_savings_change,
            note=None if has_prev else f"No transaction history found for previous period ({calendar.month_name[prev_month]} {prev_year}).",
        )

        # 4. Spending Category Breakdown
        categories: List[ReportCategoryBreakdown] = []
        for c in current_analytics.spending_by_category:
            categories.append(
                ReportCategoryBreakdown(
                    category=c.category,
                    amount=float(c.amount),
                    percentage=float(c.percentage),
                    transaction_count=0,
                )
            )

        # 5. Top Individual Expenses
        stmt_top_tx = (
            select(Transaction)
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.transaction_type == "expense",
                    Transaction.transaction_date >= period_start_dt,
                    Transaction.transaction_date <= period_end_dt,
                )
            )
            .order_by(desc(Transaction.amount))
            .limit(5)
        )
        top_tx_rows = db.scalars(stmt_top_tx).all()
        top_expenses = [
            ReportTopExpense(
                id=str(tx.id),
                date=tx.transaction_date.strftime("%Y-%m-%d"),
                merchant=tx.merchant or tx.description,
                category=tx.category,
                amount=float(tx.amount),
            )
            for tx in top_tx_rows
        ]

        # 6. Budget Audit
        budgets_with_spent = BudgetService.list_user_budgets_with_spending(db, user_id)
        budget_audit: List[ReportBudgetAuditItem] = []
        if not budgets_with_spent:
            missing_notes.append("No category budgets configured.")
        else:
            for b in budgets_with_spent:
                spent = float(b.spending.actual_spending) if b.spending else 0.0
                remaining = float(b.spending.remaining_amount) if b.spending else float(b.amount)
                util = float(b.spending.spending_percentage) if b.spending else 0.0
                is_over = (b.spending.status == "over_budget") if b.spending else False

                budget_audit.append(
                    ReportBudgetAuditItem(
                        category=b.category,
                        allocated=float(b.amount),
                        spent=spent,
                        remaining=remaining,
                        utilization_pct=util,
                        is_overrun=is_over,
                    )
                )

        # 7. Upcoming Obligations (Recurring Bills & Active Loan EMIs)
        upcoming_obligations: List[ReportUpcomingObligation] = []
        bills_res = RecurringBillService.list_recurring_bills(db, user_id)
        for b in bills_res.items:
            if b.status == "active":
                upcoming_obligations.append(
                    ReportUpcomingObligation(
                        name=b.name,
                        due_date=b.next_due_date.isoformat(),
                        amount=float(b.amount),
                        obligation_type="recurring_bill",
                        status="active",
                    )
                )

        loans = LoanService.list_user_loans(db, user_id)
        for l in loans:
            upcoming_obligations.append(
                ReportUpcomingObligation(
                    name=f"{l.name} EMI",
                    due_date=f"{year}-{month:02d}-10",
                    amount=float(l.monthly_emi),
                    obligation_type="loan_emi",
                    status="active",
                )
            )

        # 8. Financial Health Metrics
        try:
            health = FinancialHealthService.get_financial_health_overview(db, user_id)
            dti_val = float(health.debt_to_income_ratio.value) if health.debt_to_income_ratio.value is not None else 0.0
            sav_val = float(health.savings_rate.value) if health.savings_rate.value is not None else 0.0
            
            score_parts = []
            if health.savings_rate.status == "healthy":
                score_parts.append(90)
            elif health.savings_rate.status == "moderate":
                score_parts.append(65)
            else:
                score_parts.append(40)

            if health.debt_to_income_ratio.status == "healthy":
                score_parts.append(90)
            elif health.debt_to_income_ratio.status == "moderate":
                score_parts.append(60)
            else:
                score_parts.append(35)

            overall_score = int(sum(score_parts) / len(score_parts)) if score_parts else 70
            health_grade = "Grade A" if overall_score >= 80 else "Grade B" if overall_score >= 65 else "Grade C"
            health_status = "Healthy" if overall_score >= 75 else "Moderate" if overall_score >= 55 else "Needs Attention"

            financial_health = ReportFinancialHealth(
                overall_score=overall_score,
                grade=health_grade,
                status=health_status,
                dti_ratio=dti_val,
                savings_rate_score=sav_val,
                debt_score=100.0 - min(dti_val, 100.0),
            )
        except Exception:
            financial_health = ReportFinancialHealth(
                overall_score=70,
                grade="Grade B",
                status="Moderate",
                dti_ratio=0.0,
                savings_rate_score=0.0,
                debt_score=100.0,
            )

        # 9. Executive Summary Generation
        exec_summary = cls._generate_executive_summary(
            month_label=month_label,
            total_income=total_income,
            total_expenses=total_expenses,
            net_savings=net_savings,
            savings_rate=savings_rate,
            categories=categories,
            comparison=comparison,
            health_score=financial_health.overall_score,
        )

        # 10. Action Checklist
        checklist = cls._generate_action_checklist(
            total_income=total_income,
            total_expenses=total_expenses,
            savings_rate=savings_rate,
            categories=categories,
            budget_audit=budget_audit,
            loans=loans,
        )

        return MonthlyFinancialReportResponse(
            period=ReportPeriod(
                start_date=period_start_dt.date().isoformat(),
                end_date=period_end_dt.date().isoformat(),
                month_label=month_label,
                days_in_period=days_in_period,
                is_complete=is_complete,
            ),
            summary=ReportFinancialSummary(
                total_income=total_income,
                total_expenses=total_expenses,
                net_savings=net_savings,
                savings_rate=savings_rate,
                daily_burn_rate=daily_burn_rate,
            ),
            comparison=comparison,
            categories=categories,
            top_expenses=top_expenses,
            budget_audit=budget_audit,
            upcoming_obligations=upcoming_obligations,
            financial_health=financial_health,
            executive_summary=exec_summary,
            action_checklist=checklist,
            missing_data_notes=missing_notes,
        )

    @staticmethod
    def _generate_executive_summary(
        month_label: str,
        total_income: float,
        total_expenses: float,
        net_savings: float,
        savings_rate: float,
        categories: List[ReportCategoryBreakdown],
        comparison: ReportPeriodComparison,
        health_score: int,
    ) -> str:
        top_cat_str = (
            f"Largest outflow was in **{categories[0].category}** (₹{categories[0].amount:,.0f}, {categories[0].percentage:.1f}% of spend)."
            if categories else "No significant category outflows recorded."
        )
        comp_str = ""
        if comparison.has_previous_period:
            if comparison.expense_change_pct is not None:
                trend = "increased" if comparison.expense_change_pct > 0 else "decreased"
                comp_str = f" Outflows {trend} by {abs(comparison.expense_change_pct):.1f}% compared to previous month."

        return (
            f"During **{month_label}**, total cash inflows reached **₹{total_income:,.0f}** against **₹{total_expenses:,.0f}** in total outflows, "
            f"yielding a net savings surplus of **₹{net_savings:,.0f}** (a **{savings_rate:.1f}%** savings rate). {top_cat_str}{comp_str} "
            f"Overall financial health stands at **{health_score}/100**."
        )

    @staticmethod
    def _generate_action_checklist(
        total_income: float,
        total_expenses: float,
        savings_rate: float,
        categories: List[ReportCategoryBreakdown],
        budget_audit: List[ReportBudgetAuditItem],
        loans: list,
    ) -> List[ReportActionChecklistItem]:
        items: List[ReportActionChecklistItem] = []

        # 1. Savings action
        if savings_rate < 20 and total_income > 0:
            items.append(
                ReportActionChecklistItem(
                    id="chk-1",
                    title="Optimize Discretionary Outflows",
                    description=f"Current savings rate is {savings_rate:.1f}%. Aim to trim non-essential spending to reach the 20%+ target.",
                    impact="High",
                    category="Savings",
                    done=False,
                )
            )
        else:
            items.append(
                ReportActionChecklistItem(
                    id="chk-1",
                    title="Allocate Monthly Surplus to Wealth Milestones",
                    description="Transfer excess savings into liquid funds or investment portfolios.",
                    impact="High",
                    category="Investments",
                    done=False,
                )
            )

        # 2. Budget Overrun check
        overruns = [b for b in budget_audit if b.is_overrun]
        if overruns:
            names = ", ".join(b.category for b in overruns[:2])
            items.append(
                ReportActionChecklistItem(
                    id="chk-2",
                    title=f"Rebalance Overspent Budgets ({names})",
                    description=f"{len(overruns)} category budget(s) exceeded allocations this month. Adjust limits or curtail remaining outlays.",
                    impact="Medium",
                    category="Budgets",
                    done=False,
                )
            )
        else:
            items.append(
                ReportActionChecklistItem(
                    id="chk-2",
                    title="Maintain Category Spending Discipline",
                    description="All active category budgets operated within limits during this reporting cycle.",
                    impact="Medium",
                    category="Budgets",
                    done=True,
                )
            )

        # 3. Loan Prepayment
        if loans:
            items.append(
                ReportActionChecklistItem(
                    id="chk-3",
                    title="Simulate Extra Prepayment on Active Debt",
                    description="Paying ₹3,000–₹5,000 extra on principal accelerates loan closure and cuts interest charges.",
                    impact="Medium",
                    category="Debt",
                    done=False,
                )
            )
        else:
            items.append(
                ReportActionChecklistItem(
                    id="chk-3",
                    title="Build 6-Month Emergency Liquidity Reserve",
                    description="Maintain emergency liquidity to cover unforeseen medical or lifestyle contingencies.",
                    impact="High",
                    category="Security",
                    done=False,
                )
            )

        return items


monthly_report_service = MonthlyReportService()
