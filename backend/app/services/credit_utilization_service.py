from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from app.models.account import Account
from app.schemas.credit_utilization import (
    CardUtilizationItem,
    AggregateUtilization,
    CreditUtilizationResponse,
)
from app.services.account_service import AccountService


class CreditUtilizationService:
    @staticmethod
    def calculate_card_utilization(
        outstanding_balance: Decimal,
        credit_limit: Optional[Decimal],
        account_id: uuid.UUID,
        account_name: str,
    ) -> CardUtilizationItem:
        """
        Calculates credit utilization for a single credit card.
        Formula: Credit Utilization (%) = (Outstanding Balance / Credit Limit) * 100
        """
        # Ensure non-negative outstanding balance for utilization calculation
        effective_debt = max(outstanding_balance, Decimal("0.00"))

        if credit_limit is None or credit_limit <= Decimal("0.00"):
            return CardUtilizationItem(
                account_id=account_id,
                account_name=account_name,
                credit_limit=credit_limit,
                outstanding_balance=outstanding_balance,
                utilization_percentage=None,
                status="insufficient_data",
                explanation=f"No valid credit limit configured for {account_name}.",
            )

        if effective_debt == Decimal("0.00"):
            return CardUtilizationItem(
                account_id=account_id,
                account_name=account_name,
                credit_limit=credit_limit,
                outstanding_balance=outstanding_balance,
                utilization_percentage=Decimal("0.00"),
                status="healthy",
                explanation=f"Zero outstanding balance on {account_name} (0.00% utilization).",
            )

        utilization = ((effective_debt / credit_limit) * Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if utilization <= Decimal("30.00"):
            status_val = "healthy"
            explanation = f"Credit utilization of {utilization:.2f}% is within the healthy ≤ 30.00% benchmark."
        elif utilization <= Decimal("50.00"):
            status_val = "moderate"
            explanation = f"Credit utilization of {utilization:.2f}% is moderate (target benchmark is ≤ 30.00%)."
        else:
            status_val = "critical"
            explanation = f"High credit utilization of {utilization:.2f}% exceeds the 50.00% risk threshold."

        return CardUtilizationItem(
            account_id=account_id,
            account_name=account_name,
            credit_limit=credit_limit,
            outstanding_balance=outstanding_balance,
            utilization_percentage=utilization,
            status=status_val,
            explanation=explanation,
        )

    @staticmethod
    def calculate_aggregate_utilization(
        cards: List[CardUtilizationItem],
    ) -> AggregateUtilization:
        """
        Calculates aggregate user-level utilization across all credit cards:
        Total outstanding debt / Total credit limits * 100.
        Cards without valid credit limits are excluded from the percentage calculation.
        """
        valid_cards = [c for c in cards if c.credit_limit is not None and c.credit_limit > Decimal("0.00")]

        if not valid_cards:
            total_debt = sum(
                (max(c.outstanding_balance, Decimal("0.00")) for c in cards),
                Decimal("0.00"),
            )
            return AggregateUtilization(
                total_outstanding=total_debt,
                total_credit_limit=Decimal("0.00"),
                utilization_percentage=None,
                status="insufficient_data",
                explanation="No credit cards with valid credit limits available to calculate aggregate utilization.",
            )

        total_debt = sum(
            (max(c.outstanding_balance, Decimal("0.00")) for c in valid_cards),
            Decimal("0.00"),
        )
        total_limit = sum((c.credit_limit for c in valid_cards), Decimal("0.00"))

        if total_limit <= Decimal("0.00"):
            return AggregateUtilization(
                total_outstanding=total_debt,
                total_credit_limit=Decimal("0.00"),
                utilization_percentage=None,
                status="insufficient_data",
                explanation="Total credit limit is zero or not configured.",
            )

        if total_debt == Decimal("0.00"):
            return AggregateUtilization(
                total_outstanding=Decimal("0.00"),
                total_credit_limit=total_limit,
                utilization_percentage=Decimal("0.00"),
                status="healthy",
                explanation="Zero total outstanding credit card debt across all cards (0.00% utilization).",
            )

        aggregate_pct = ((total_debt / total_limit) * Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if aggregate_pct <= Decimal("30.00"):
            status_val = "healthy"
            explanation = f"Aggregate credit utilization of {aggregate_pct:.2f}% is within healthy ≤ 30.00% benchmark."
        elif aggregate_pct <= Decimal("50.00"):
            status_val = "moderate"
            explanation = f"Aggregate credit utilization of {aggregate_pct:.2f}% is moderate (target benchmark is ≤ 30.00%)."
        else:
            status_val = "critical"
            explanation = f"High aggregate credit utilization of {aggregate_pct:.2f}% exceeds the 50.00% risk threshold."

        return AggregateUtilization(
            total_outstanding=total_debt,
            total_credit_limit=total_limit,
            utilization_percentage=aggregate_pct,
            status=status_val,
            explanation=explanation,
        )

    @staticmethod
    def get_user_credit_utilization(
        db: Session,
        user_id: uuid.UUID,
    ) -> CreditUtilizationResponse:
        """
        Retrieves all credit card accounts for the authenticated user, uses the existing
        dynamic ledger balance calculation, and deterministically computes per-card
        and aggregate credit utilization.
        """
        # Query only accounts owned by user with account_type == 'credit_card'
        cc_accounts = (
            db.query(Account)
            .filter(
                Account.user_id == user_id,
                Account.account_type == "credit_card",
            )
            .order_by(Account.created_at.asc())
            .all()
        )

        card_items: List[CardUtilizationItem] = []
        for acc in cc_accounts:
            # Reuse existing dynamic ledger balance calculation
            outstanding_balance = AccountService.calculate_account_balance(db, acc)
            card_item = CreditUtilizationService.calculate_card_utilization(
                outstanding_balance=outstanding_balance,
                credit_limit=acc.credit_limit,
                account_id=acc.id,
                account_name=acc.name,
            )
            card_items.append(card_item)

        aggregate = CreditUtilizationService.calculate_aggregate_utilization(card_items)

        return CreditUtilizationResponse(
            user_id=user_id,
            cards=card_items,
            aggregate=aggregate,
        )
