import calendar
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.analytics import (
    AccountBreakdownItem,
    AnalyticsOverviewResponse,
    AnalyticsPeriod,
    AnalyticsSummary,
    CategoryBreakdownItem,
    TopExpenseItem,
    TrendItem,
)


class AnalyticsService:
    @staticmethod
    def get_analytics_overview(
        db: Session,
        user_id: uuid.UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        account_id: Optional[uuid.UUID] = None,
    ) -> AnalyticsOverviewResponse:
        """
        Computes deterministic, aggregated spending analytics for a user over a date range.
        Excludes inter-account transfers from income, expenses, category spending, and cash flow.
        """
        # Resolve default date range (current calendar month in UTC)
        now = datetime.now(timezone.utc)
        if start_date is None:
            start_date = datetime(now.year, now.month, 1, 0, 0, 0, 0, tzinfo=timezone.utc)
        if end_date is None:
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = datetime(now.year, now.month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)

        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date cannot be greater than end_date.",
            )

        # Validate account ownership if filtered by account
        if account_id is not None:
            account = (
                db.query(Account)
                .filter(Account.id == account_id, Account.user_id == user_id)
                .first()
            )
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The specified account does not exist or does not belong to the authenticated user.",
                )

        # 1. Summary Metrics: total_income, total_expenses
        summary_query = db.query(
            func.coalesce(
                func.sum(
                    case(
                        (Transaction.transaction_type == "income", Transaction.amount),
                        else_=Decimal("0.00"),
                    )
                ),
                Decimal("0.00"),
            ).label("total_income"),
            func.coalesce(
                func.sum(
                    case(
                        (Transaction.transaction_type == "expense", Transaction.amount),
                        else_=Decimal("0.00"),
                    )
                ),
                Decimal("0.00"),
            ).label("total_expenses"),
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type != "transfer",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )

        if account_id is not None:
            summary_query = summary_query.filter(Transaction.account_id == account_id)

        summary_row = summary_query.first()
        total_income = summary_row[0] if summary_row else Decimal("0.00")
        total_expenses = summary_row[1] if summary_row else Decimal("0.00")
        net_cash_flow = total_income - total_expenses

        if total_income > Decimal("0.00"):
            savings_rate = round(((total_income - total_expenses) / total_income) * Decimal("100"), 2)
        else:
            savings_rate = Decimal("0.00")

        summary = AnalyticsSummary(
            total_income=total_income,
            total_expenses=total_expenses,
            net_cash_flow=net_cash_flow,
            savings_rate=savings_rate,
        )

        # 2. Spending by Category (Expenses only)
        cat_expense_sum = func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label("cat_total")
        spending_cat_query = (
            db.query(
                Transaction.category,
                cat_expense_sum,
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
        )
        if account_id is not None:
            spending_cat_query = spending_cat_query.filter(Transaction.account_id == account_id)

        spending_cat_rows = (
            spending_cat_query.group_by(Transaction.category)
            .order_by(cat_expense_sum.desc())
            .all()
        )

        spending_by_category = [
            CategoryBreakdownItem(
                category=cat,
                amount=amt,
                percentage=(
                    round((amt / total_expenses) * Decimal("100"), 2)
                    if total_expenses > Decimal("0.00")
                    else Decimal("0.00")
                ),
            )
            for cat, amt in spending_cat_rows
        ]

        # 3. Income by Category (Income only)
        cat_income_sum = func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label("cat_total")
        income_cat_query = (
            db.query(
                Transaction.category,
                cat_income_sum,
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "income",
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
        )
        if account_id is not None:
            income_cat_query = income_cat_query.filter(Transaction.account_id == account_id)

        income_cat_rows = (
            income_cat_query.group_by(Transaction.category)
            .order_by(cat_income_sum.desc())
            .all()
        )

        income_by_category = [
            CategoryBreakdownItem(
                category=cat,
                amount=amt,
                percentage=(
                    round((amt / total_income) * Decimal("100"), 2)
                    if total_income > Decimal("0.00")
                    else Decimal("0.00")
                ),
            )
            for cat, amt in income_cat_rows
        ]

        # 4. Account Breakdown
        acc_query = (
            db.query(
                Account.id,
                Account.name,
                Account.account_type,
                func.coalesce(
                    func.sum(
                        case(
                            (
                                (Transaction.transaction_type == "income")
                                & (Transaction.transaction_date >= start_date)
                                & (Transaction.transaction_date <= end_date),
                                Transaction.amount,
                            ),
                            else_=Decimal("0.00"),
                        )
                    ),
                    Decimal("0.00"),
                ).label("income"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                (Transaction.transaction_type == "expense")
                                & (Transaction.transaction_date >= start_date)
                                & (Transaction.transaction_date <= end_date),
                                Transaction.amount,
                            ),
                            else_=Decimal("0.00"),
                        )
                    ),
                    Decimal("0.00"),
                ).label("expenses"),
            )
            .outerjoin(
                Transaction,
                (Transaction.account_id == Account.id)
                & (Transaction.user_id == Account.user_id)
                & (Transaction.transaction_type != "transfer"),
            )
            .filter(Account.user_id == user_id)
        )
        if account_id is not None:
            acc_query = acc_query.filter(Account.id == account_id)

        acc_rows = (
            acc_query.group_by(Account.id, Account.name, Account.account_type, Account.created_at)
            .order_by(Account.created_at.asc())
            .all()
        )

        account_breakdown = [
            AccountBreakdownItem(
                account_id=acc_id,
                account_name=acc_name,
                account_type=acc_type,
                income=inc,
                expenses=exp,
                net_cash_flow=inc - exp,
            )
            for acc_id, acc_name, acc_type, inc, exp in acc_rows
        ]

        # 5. Time Series Trend
        delta_days = (end_date - start_date).days
        date_format = "YYYY-MM-DD" if delta_days <= 31 else "YYYY-MM"
        period_expr = func.to_char(Transaction.transaction_date, date_format).label("period")

        trend_query = (
            db.query(
                period_expr,
                func.coalesce(
                    func.sum(
                        case(
                            (Transaction.transaction_type == "income", Transaction.amount),
                            else_=Decimal("0.00"),
                        )
                    ),
                    Decimal("0.00"),
                ).label("period_income"),
                func.coalesce(
                    func.sum(
                        case(
                            (Transaction.transaction_type == "expense", Transaction.amount),
                            else_=Decimal("0.00"),
                        )
                    ),
                    Decimal("0.00"),
                ).label("period_expenses"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type != "transfer",
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
        )
        if account_id is not None:
            trend_query = trend_query.filter(Transaction.account_id == account_id)

        trend_rows = (
            trend_query.group_by(period_expr)
            .order_by(period_expr.asc())
            .all()
        )

        trend = [
            TrendItem(
                period=period_str,
                income=p_inc,
                expenses=p_exp,
                net_cash_flow=p_inc - p_exp,
            )
            for period_str, p_inc, p_exp in trend_rows
        ]

        # 6. Top Expenses (limit 10)
        top_exp_query = (
            db.query(
                Transaction.id,
                Transaction.amount,
                Transaction.category,
                Transaction.merchant,
                Transaction.description,
                Transaction.transaction_date,
                Transaction.account_id,
                Account.name.label("account_name"),
            )
            .join(Account, Account.id == Transaction.account_id)
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
        )
        if account_id is not None:
            top_exp_query = top_exp_query.filter(Transaction.account_id == account_id)

        top_exp_rows = (
            top_exp_query.order_by(
                Transaction.amount.desc(),
                Transaction.transaction_date.desc(),
            )
            .limit(10)
            .all()
        )

        top_expenses = [
            TopExpenseItem(
                id=tx_id,
                amount=amt,
                category=cat,
                merchant=merch,
                description=desc,
                transaction_date=tx_date,
                account_id=acc_id,
                account_name=acc_name,
            )
            for tx_id, amt, cat, merch, desc, tx_date, acc_id, acc_name in top_exp_rows
        ]

        return AnalyticsOverviewResponse(
            period=AnalyticsPeriod(start_date=start_date, end_date=end_date),
            summary=summary,
            spending_by_category=spending_by_category,
            income_by_category=income_by_category,
            account_breakdown=account_breakdown,
            trend=trend,
            top_expenses=top_expenses,
        )
