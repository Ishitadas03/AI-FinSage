"""
Grounded AI Copilot Service (Phase 4).

Orchestrates user-scoped data retrieval, deterministic calculation grounding,
context synthesis, and conversational history persistence.
"""
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional
import uuid
import json
import logging
import re
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from app.models.user import User
from app.models.chat_message import ChatMessage
from app.schemas.copilot import ChatMessageResponse, ChatHistoryResponse
from app.services.llm_client import llm_client, sanitize_untrusted_input
from app.services.account_service import AccountService
from app.services.analytics_service import AnalyticsService
from app.services.budget_service import BudgetService
from app.services.loan_service import LoanService
from app.services.recurring_bill_service import RecurringBillService
from app.services.financial_health_service import FinancialHealthService
from app.services.goal_service import GoalService

logger = logging.getLogger(__name__)

INTENT_KEYWORDS = {
    "budget": ["budget", "budgets", "limit", "allowance", "overrun", "overspent", "cap"],
    "loan_emi": ["loan", "loans", "emi", "mortgage", "debt", "interest", "prepay", "prepayment", "principal", "dti"],
    "recurring_bills": ["bill", "bills", "recurring", "subscription", "subscriptions", "netflix", "gym", "electricity", "rent", "due date"],
    "savings_goal": ["goal", "goals", "target", "emergency fund", "wealth", "milestone"],
    "financial_health": ["health", "score", "grade", "financial status", "summary", "standing", "review", "audit"],
    "spending": ["spend", "spending", "expense", "expenses", "bought", "cost", "outflow", "burn", "transaction", "shopping", "food", "dining"],
}


def classify_intent(message: str) -> str:
    """Classifies user question intent deterministically based on keyword mapping."""
    lower = message.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            pattern = rf"\b{re.escape(kw.lower())}\b"
            if re.search(pattern, lower):
                return intent
    return "general"


def generate_suggested_queries(intent: str) -> List[str]:
    """Provides relevant follow-up suggestions based on detected intent."""
    if intent == "spending":
        return [
            "How can I reduce my top discretionary expense category?",
            "What is my current monthly savings rate?",
            "Show my fixed vs discretionary spend ratio",
        ]
    elif intent == "budget":
        return [
            "Which category budgets have the highest overrun risk?",
            "How much unallocated surplus do I have this month?",
            "Show my budget utilization breakdown",
        ]
    elif intent == "loan_emi":
        return [
            "What happens if I pay ₹5,000 extra per month on my loan?",
            "What is my Debt-to-Income (DTI) ratio?",
            "Which loan should I prioritize paying off first?",
        ]
    elif intent == "recurring_bills":
        return [
            "What bills are due in the next 7 days?",
            "How much do I spend on subscriptions each month?",
            "Show all active recurring payment rules",
        ]
    elif intent == "savings_goal":
        return [
            "How can I reach my savings milestones faster?",
            "What percentage of my income is going into goals?",
            "Can I afford to allocate ₹10,000 more to my emergency fund?",
        ]
    elif intent == "financial_health":
        return [
            "What are the key drivers impacting my health score?",
            "How does my savings rate compare to recommended benchmarks?",
            "Show my full financial health pillar breakdown",
        ]
    return [
        "How can I save ₹10,000 more this month?",
        "What are my upcoming recurring bills?",
        "Simulate paying ₹5,000 extra on my loan",
        "Give me an executive summary of my financial health",
    ]


class CopilotService:
    """Service handling Grounded AI Copilot operations."""

    @staticmethod
    def retrieve_grounded_context(db: Session, user_id: uuid.UUID, intent: str) -> Dict[str, Any]:
        """
        Retrieves user-scoped financial data and computes deterministic ground-truth numbers.
        """
        context: Dict[str, Any] = {}

        # 1. Accounts & Net Worth
        accounts = AccountService.list_user_accounts(db, user_id)
        total_balance = sum(float(a.current_balance if a.current_balance is not None else a.balance or 0.0) for a in accounts)
        context["net_worth"] = round(total_balance, 2)
        context["active_accounts_count"] = len(accounts)

        # 2. Analytics (Current Month)
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)
        next_month = 1 if now.month == 12 else now.month + 1
        next_year = now.year + 1 if now.month == 12 else now.year
        end_of_month = datetime(next_year, next_month, 1, 0, 0, 0, tzinfo=timezone.utc) - timedelta(seconds=1)

        try:
            analytics = AnalyticsService.get_analytics_overview(
                db=db,
                user_id=user_id,
                start_date=start_of_month,
                end_date=end_of_month,
            )
            context["monthly_income"] = round(float(analytics.summary.total_income), 2)
            context["monthly_expenses"] = round(float(analytics.summary.total_expenses), 2)
            context["net_cash_flow"] = round(float(analytics.summary.net_cash_flow), 2)
            context["savings_rate"] = round(float(analytics.summary.savings_rate), 2)
            context["top_categories"] = [
                {"category": c.category, "amount": float(c.amount), "percentage": float(c.percentage)}
                for c in analytics.spending_by_category[:5]
            ]
        except Exception as e:
            logger.warning(f"Error computing analytics for copilot context: {e}")
            context["monthly_income"] = 0.0
            context["monthly_expenses"] = 0.0
            context["net_cash_flow"] = 0.0
            context["savings_rate"] = 0.0
            context["top_categories"] = []

        # 3. Budgets
        try:
            budgets = BudgetService.list_user_budgets_with_spending(db, user_id)
            context["budgets"] = [
                {
                    "category": b.category,
                    "allocated": float(b.amount),
                    "spent": float(b.spending.actual_spending) if b.spending else 0.0,
                    "utilization_pct": float(b.spending.spending_percentage) if b.spending else 0.0,
                    "is_overrun": (b.spending.status == "over_budget") if b.spending else False,
                }
                for b in budgets
            ]
        except Exception:
            context["budgets"] = []

        # 4. Loans & Debt
        try:
            loans = LoanService.list_user_loans(db, user_id)
            context["loans"] = [
                {
                    "name": l.name,
                    "outstanding_principal": float(l.outstanding_principal),
                    "monthly_emi": float(l.monthly_emi),
                    "interest_rate": float(l.interest_rate),
                }
                for l in loans
            ]
            total_emi = sum(l["monthly_emi"] for l in context["loans"])
            income = context.get("monthly_income", 0.0)
            context["dti_ratio"] = round((total_emi / income * 100), 1) if income > 0 else 0.0
        except Exception:
            context["loans"] = []
            context["dti_ratio"] = 0.0

        # 5. Recurring Bills
        try:
            bills_res = RecurringBillService.list_recurring_bills(db, user_id)
            context["recurring_bills"] = [
                {
                    "name": b.name,
                    "amount": float(b.amount),
                    "frequency": b.frequency,
                    "next_due_date": b.next_due_date.isoformat(),
                    "status": b.status,
                }
                for b in bills_res.items
            ]
        except Exception:
            context["recurring_bills"] = []

        # 6. Financial Goals
        try:
            goals = GoalService.list_user_goals(db, user_id)
            context["goals"] = [
                {
                    "name": g.name,
                    "target_amount": float(g.target_amount),
                    "current_amount": float(g.current_amount),
                    "progress_percentage": round(float(g.current_amount / g.target_amount * 100), 1) if g.target_amount > 0 else 0.0,
                    "status": g.status,
                }
                for g in goals
            ]
        except Exception:
            context["goals"] = []

        # 7. Financial Health Overview
        try:
            health = FinancialHealthService.get_financial_health_overview(db, user_id)
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

            score = int(sum(score_parts) / len(score_parts)) if score_parts else 70
            context["health_score"] = score
            context["health_grade"] = "Healthy" if score >= 80 else "Moderate" if score >= 60 else "Needs Attention"
        except Exception:
            context["health_score"] = 70
            context["health_grade"] = "Moderate"

        return context

    @classmethod
    async def chat(
        cls,
        db: Session,
        user: User,
        message: str,
    ) -> ChatMessageResponse:
        """
        Processes a user question, retrieves grounded context, calls synthesis engine,
        persists conversation records, and returns structured answer.
        """
        cleaned_msg = sanitize_untrusted_input(message)
        if not cleaned_msg:
            cleaned_msg = "Provide a summary of my finances."

        intent = classify_intent(cleaned_msg)
        verified_context = cls.retrieve_grounded_context(db, user.id, intent)

        # 1. Record User Message
        user_record = ChatMessage(
            user_id=user.id,
            role="user",
            content=cleaned_msg,
            intent=intent,
            metrics_snapshot=None,
        )
        db.add(user_record)
        db.flush()

        # 2. Generate Grounded AI Explanation
        explanation = await llm_client.generate_copilot_response(
            user_message=cleaned_msg,
            intent=intent,
            verified_context=verified_context,
        )

        # 3. Create Assistant Message Record with snapshot
        assistant_record = ChatMessage(
            user_id=user.id,
            role="assistant",
            content=explanation,
            intent=intent,
            metrics_snapshot=json.dumps(verified_context),
        )
        db.add(assistant_record)
        db.commit()
        db.refresh(assistant_record)

        suggested_queries = generate_suggested_queries(intent)

        return ChatMessageResponse(
            id=assistant_record.id,
            role=assistant_record.role,
            content=assistant_record.content,
            intent=assistant_record.intent,
            metrics_snapshot=verified_context,
            suggested_queries=suggested_queries,
            created_at=assistant_record.created_at,
        )

    @classmethod
    def get_history(
        cls,
        db: Session,
        user_id: uuid.UUID,
        limit: int = 50,
    ) -> ChatHistoryResponse:
        """Returns user-scoped chat message history."""
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        records = db.scalars(stmt).all()

        items = []
        for r in records:
            items.append(
                ChatMessageResponse(
                    id=r.id,
                    role=r.role,
                    content=r.content,
                    intent=r.intent,
                    metrics_snapshot=r.get_metrics_snapshot_dict(),
                    suggested_queries=generate_suggested_queries(r.intent or "general"),
                    created_at=r.created_at,
                )
            )

        return ChatHistoryResponse(
            items=items,
            total=len(items),
        )

    @classmethod
    def clear_history(cls, db: Session, user_id: uuid.UUID) -> bool:
        """Deletes all user-scoped chat messages."""
        stmt = delete(ChatMessage).where(ChatMessage.user_id == user_id)
        db.execute(stmt)
        db.commit()
        return True


copilot_service = CopilotService()
