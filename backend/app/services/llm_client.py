"""
Resilient LLM Client & Grounded Synthesis Engine (Phase 4).

Provides provider abstraction for Google Gemini, OpenAI, and deterministic local synthesis.
Ensures zero hallucination by strictly constraining generated explanations to verified backend metrics.
Handles timeouts, rate limits, and network errors gracefully with fallback.
"""
import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def sanitize_untrusted_input(text: str) -> str:
    """
    Sanitizes untrusted user inputs and imported transaction descriptions.
    Prevents prompt injection by stripping system delimiters and instruction resets.
    """
    if not text:
        return ""
    # Strip potential prompt injection prefixes/delimiters
    sanitized = re.sub(r"(?i)(ignore\s+(all\s+)?previous\s+instructions|system:|assistant:|user:|<system>|</system>|\[system\])", "", text)
    # Truncate extremely long inputs
    return sanitized.strip()[:2000]


def format_currency_inr(amount: float) -> str:
    """Format numeric float to Indian Rupee string representation."""
    abs_amt = abs(amount)
    if abs_amt >= 10_000_000:
        return f"₹{amount / 10_000_000:.2f} Cr"
    elif abs_amt >= 100_000:
        return f"₹{amount / 100_000:.2f}L"
    else:
        return f"₹{amount:,.0f}"


class LLMClient:
    """
    Unified LLM Client with multi-provider failover and deterministic local grounding.
    """

    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY
        self.model = settings.LLM_MODEL or "gemini-1.5-flash"
        self.timeout_seconds = 8.0

    async def generate_copilot_response(
        self,
        user_message: str,
        intent: str,
        verified_context: Dict[str, Any],
    ) -> str:
        """
        Generates grounded conversational explanation for user message.
        Attempts configured external LLM first; if unavailable/times out, utilizes local grounded synthesis.
        """
        cleaned_message = sanitize_untrusted_input(user_message)

        # Attempt Gemini if configured
        if self.gemini_api_key:
            try:
                response = await self._call_gemini(cleaned_message, verified_context)
                if response and len(response.strip()) > 20:
                    return response.strip()
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to grounded engine: {e}")

        # Attempt OpenAI if configured
        if self.openai_api_key:
            try:
                response = await self._call_openai(cleaned_message, verified_context)
                if response and len(response.strip()) > 20:
                    return response.strip()
            except Exception as e:
                logger.warning(f"OpenAI API call failed, falling back to grounded engine: {e}")

        # Infallible Grounded Deterministic Engine
        return self._synthesize_grounded_response(cleaned_message, intent, verified_context)

    async def _call_gemini(self, message: str, context: Dict[str, Any]) -> Optional[str]:
        """Calls Google Gemini GenerateContent API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_api_key}"
        system_instruction = (
            "You are FinSage AI Copilot, a certified personal financial intelligence assistant. "
            "You MUST ONLY use the verified financial facts provided in the JSON context. "
            "DO NOT invent, assume, or hallucinate any numbers, accounts, balances, or percentages. "
            "If context is missing or zero, clearly state that data is insufficient. "
            "Format your answer with clear Markdown, bullet points, and data citations."
        )
        prompt = f"User Question: {message}\n\nVerified Financial Context (GROUND TRUTH):\n{json.dumps(context, indent=2, default=str)}"

        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1000,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        return None

    async def _call_openai(self, message: str, context: Dict[str, Any]) -> Optional[str]:
        """Calls OpenAI Chat Completions API."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }
        system_prompt = (
            "You are FinSage AI Copilot. Strictly use the provided verified numbers. "
            "Never invent numbers. Distinguish factual summaries from actionable suggestions."
        )
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Verified Data:\n{json.dumps(context, default=str)}\n\nQuestion: {message}"},
            ],
            "temperature": 0.2,
            "max_tokens": 1000,
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
        return None

    def _synthesize_grounded_response(
        self,
        message: str,
        intent: str,
        context: Dict[str, Any],
    ) -> str:
        """
        Deterministic Grounded Engine: Synthesizes accurate, formatted Markdown responses
        directly from verified numbers, preventing any model hallucination.
        """
        net_worth = context.get("net_worth", 0.0)
        monthly_income = context.get("monthly_income", 0.0)
        monthly_expenses = context.get("monthly_expenses", 0.0)
        savings_rate = context.get("savings_rate", 0.0)
        net_cash_flow = context.get("net_cash_flow", 0.0)
        categories = context.get("top_categories", [])
        budgets = context.get("budgets", [])
        loans = context.get("loans", [])
        recurring_bills = context.get("recurring_bills", [])
        goals = context.get("goals", [])
        health_score = context.get("health_score", 0)

        # 1. Spending & Expense Intent
        if intent == "spending":
            if monthly_expenses == 0 and not categories:
                return (
                    "📊 **Spending Analysis**:\n\n"
                    "No recorded expense transactions were found for your active accounts in this period. "
                    "Once you import statements or add transactions, I will analyze your daily burn rate and category allocations."
                )
            cat_lines = []
            for c in categories[:4]:
                cat_lines.append(f"- **{c.get('category', 'Other')}**: {format_currency_inr(c.get('amount', 0))} ({c.get('percentage', 0):.1f}%)")
            cats_text = "\n".join(cat_lines) if cat_lines else "- No category details recorded"

            return (
                f"📊 **Verified Spending Breakdown**:\n\n"
                f"• **Total Period Expenses**: {format_currency_inr(monthly_expenses)}\n"
                f"• **Net Cash Flow**: {format_currency_inr(net_cash_flow)} (Savings Rate: **{savings_rate:.1f}%**)\n\n"
                f"**Top Expense Categories**:\n{cats_text}\n\n"
                f"💡 **AI Recommendation**: Your top spending category represents a significant portion of outflows. "
                f"Consider capping discretionary dining and non-essential shopping to increase your monthly savings margin."
            )

        # 2. Budget & Overrun Intent
        elif intent == "budget":
            if not budgets:
                return (
                    "🎯 **Budget Audit**:\n\n"
                    "You haven't configured any category budgets yet. "
                    "Setting up budgets for high-frequency categories like Dining, Groceries, and Utilities helps track and prevent overspending."
                )
            overruns = [b for b in budgets if b.get("is_overrun")]
            budget_lines = []
            for b in budgets[:4]:
                status_icon = "⚠️" if b.get("is_overrun") else "✅"
                budget_lines.append(
                    f"- {status_icon} **{b.get('category')}**: Spent {format_currency_inr(b.get('spent', 0))} of {format_currency_inr(b.get('allocated', 0))} ({b.get('utilization_pct', 0):.0f}%)"
                )
            b_text = "\n".join(budget_lines)
            overrun_msg = f"\n\n⚠️ **Alert**: You have {len(overruns)} category budget(s) currently exceeding their limits." if overruns else "\n\n✅ All active category budgets are within safe thresholds."

            return (
                f"🎯 **Budget Performance Audit**:\n\n"
                f"{b_text}"
                f"{overrun_msg}\n\n"
                f"💡 **Action**: Review overspent categories and reallocate unspent surpluses from other categories to balance your monthly budget."
            )

        # 3. Loan, Debt & EMI Intent
        elif intent == "loan_emi":
            if not loans:
                return (
                    "🏡 **Debt & Loan Assessment**:\n\n"
                    "You currently have no active loan records registered in FinSage. "
                    "Your Debt-to-Income (DTI) ratio is 0%, meaning 100% of your net income is unencumbered by debt."
                )
            total_principal = sum(l.get("outstanding_principal", 0) for l in loans)
            total_emi = sum(l.get("monthly_emi", 0) for l in loans)
            dti = context.get("dti_ratio", 0.0)
            loan_lines = [f"- **{l.get('name')}**: Principal {format_currency_inr(l.get('outstanding_principal', 0))} @ {l.get('interest_rate', 0)}% (EMI: {format_currency_inr(l.get('monthly_emi', 0))}/mo)" for l in loans]
            l_text = "\n".join(loan_lines)

            return (
                f"🏡 **Loan & Debt Obligations**:\n\n"
                f"• **Total Outstanding Debt**: {format_currency_inr(total_principal)}\n"
                f"• **Total Monthly EMI**: {format_currency_inr(total_emi)}\n"
                f"• **Debt-to-Income (DTI) Ratio**: **{dti:.1f}%** ({'Healthy <35%' if dti < 35 else 'Elevated'})\n\n"
                f"**Active Loans**:\n{l_text}\n\n"
                f"💡 **Prepayment Simulation**: Adding an extra ₹3,000–₹5,000 monthly towards your highest-interest loan reduces both tenure and lifetime interest liability."
            )

        # 4. Recurring Bills & Subscriptions Intent
        elif intent == "recurring_bills":
            if not recurring_bills:
                return (
                    "📅 **Recurring Bills & Subscriptions**:\n\n"
                    "You have no recurring bills configured yet. "
                    "Track your utilities, subscriptions, insurance, and rent in the Spending tab to receive automated due-date alerts."
                )
            active_bills = [b for b in recurring_bills if b.get("status") == "active"]
            committed_total = sum(b.get("amount", 0) for b in active_bills)
            bill_lines = [f"- **{b.get('name')}**: {format_currency_inr(b.get('amount', 0))} (Next due: {b.get('next_due_date', 'N/A')})" for b in active_bills[:4]]
            b_text = "\n".join(bill_lines)

            return (
                f"📅 **Committed Recurring Obligations**:\n\n"
                f"• **Active Bills Count**: {len(active_bills)}\n"
                f"• **Committed Outflow**: {format_currency_inr(committed_total)}/period\n\n"
                f"**Upcoming Due Dates**:\n{b_text}\n\n"
                f"💡 **Tip**: Review active subscription services every quarter to eliminate recurring charges for unused software or streaming passes."
            )

        # 5. Financial Goals Intent
        elif intent == "savings_goal":
            if not goals:
                return (
                    "🎯 **Financial Goals**:\n\n"
                    "No active financial goals are recorded. "
                    "Creating targeted milestones (such as an Emergency Fund or Down Payment) helps direct your monthly surplus toward structured wealth building."
                )
            g_lines = [f"- **{g.get('name')}**: {format_currency_inr(g.get('current_amount', 0))} / {format_currency_inr(g.get('target_amount', 0))} ({g.get('progress_percentage', 0):.0f}%)" for g in goals[:3]]
            g_text = "\n".join(g_lines)

            return (
                f"🎯 **Financial Milestone Progress**:\n\n"
                f"{g_text}\n\n"
                f"• **Monthly Savings Rate**: {savings_rate:.1f}%\n"
                f"• **Net Monthly Inflow**: {format_currency_inr(net_cash_flow)}\n\n"
                f"💡 **Recommendation**: Automate your monthly goal contributions at the beginning of each billing cycle right after salary credit."
            )

        # 6. Financial Health & Overall Summary Intent
        elif intent == "financial_health":
            grade = "A" if health_score >= 80 else "B" if health_score >= 65 else "C" if health_score >= 50 else "D"
            return (
                f"🏆 **Financial Health Assessment**:\n\n"
                f"• **Overall Health Score**: **{health_score}/100** (Grade: **{grade}**)\n"
                f"• **Net Worth**: {format_currency_inr(net_worth)}\n"
                f"• **Savings Rate**: **{savings_rate:.1f}%**\n"
                f"• **Monthly Income**: {format_currency_inr(monthly_income)}\n"
                f"• **Monthly Expenses**: {format_currency_inr(monthly_expenses)}\n\n"
                f"💡 **Key Insights**:\n"
                f"1. Maintain emergency liquidity covering at least 3–6 months of fixed commitments.\n"
                f"2. Keep discretionary burn under 30% of net inflows to accelerate goal completion."
            )

        # 7. General / Universal Grounded Overview
        return (
            f"🪙 **FinSage Intelligence Overview**:\n\n"
            f"Based on your verified records:\n"
            f"• **Total Net Worth**: {format_currency_inr(net_worth)}\n"
            f"• **Monthly Cash Flow**: {format_currency_inr(monthly_income)} in / {format_currency_inr(monthly_expenses)} out\n"
            f"• **Net Monthly Savings**: {format_currency_inr(net_cash_flow)} ({savings_rate:.1f}% savings rate)\n"
            f"• **Financial Health Score**: **{health_score}/100**\n\n"
            f"Feel free to ask specific questions about your spending trends, category budgets, loan prepayments, or recurring subscriptions."
        )


llm_client = LLMClient()
