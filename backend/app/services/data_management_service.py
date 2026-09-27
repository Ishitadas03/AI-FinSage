"""
Financial Data Management & Account Lifecycle Service (Phase 5).

Handles user-initiated data exports (JSON, CSV Zip) and explicit, confirmed account deletions
with complete cascading ledger cleanup and immutable audit logging.
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional
import io
import csv
import zipfile
import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.financial_goal import FinancialGoal
from app.models.loan import Loan
from app.models.recurring_bill import RecurringBill
from app.models.notification import Notification
from app.models.chat_message import ChatMessage
from app.models.refresh_session import RefreshSession
from app.schemas.data_management import (
    DataExportMetadata,
    UserDataExportResponse,
    AccountDeletionResponse,
)
from app.schemas.user import UserDeleteRequest, mask_pan
from app.services.audit_log_service import audit_log_service
from app.services.clerk_service import clerk_service

logger = logging.getLogger(__name__)


class DataManagementService:
    @staticmethod
    def _collect_raw_user_records(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """Gathers all financial ledger entities scoped strictly to the authenticated user."""
        accounts = db.query(Account).filter(Account.user_id == user_id).all()
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
        goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()
        loans = db.query(Loan).filter(Loan.user_id == user_id).all()
        recurring_bills = db.query(RecurringBill).filter(RecurringBill.user_id == user_id).all()
        notifications = db.query(Notification).filter(Notification.user_id == user_id).all()

        return {
            "accounts": accounts,
            "transactions": transactions,
            "budgets": budgets,
            "goals": goals,
            "loans": loans,
            "recurring_bills": recurring_bills,
            "notifications": notifications,
        }

    @staticmethod
    def export_user_data_json(
        db: Session,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserDataExportResponse:
        """Generates a complete, structured JSON export of the user's financial ledger."""
        raw = DataManagementService._collect_raw_user_records(db, user.id)

        accounts_data = [
            {
                "id": str(a.id),
                "name": a.name,
                "account_type": a.account_type,
                "balance": float(a.balance),
                "credit_limit": float(a.credit_limit) if a.credit_limit is not None else None,
                "currency": a.currency,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in raw["accounts"]
        ]

        transactions_data = [
            {
                "id": str(t.id),
                "account_id": str(t.account_id),
                "destination_account_id": str(t.destination_account_id) if t.destination_account_id else None,
                "amount": float(t.amount),
                "transaction_type": t.transaction_type,
                "category": t.category,
                "merchant": t.merchant,
                "description": t.description,
                "reference": t.reference,
                "source": t.source,
                "transaction_date": t.transaction_date.isoformat() if t.transaction_date else None,
            }
            for t in raw["transactions"]
        ]

        budgets_data = [
            {
                "id": str(b.id),
                "name": b.name,
                "category": b.category,
                "amount": float(b.amount),
                "period": b.period,
                "start_date": b.start_date.isoformat() if b.start_date else None,
                "end_date": b.end_date.isoformat() if b.end_date else None,
            }
            for b in raw["budgets"]
        ]

        goals_data = [
            {
                "id": str(g.id),
                "name": g.name,
                "goal_type": g.goal_type,
                "target_amount": float(g.target_amount),
                "current_amount": float(g.current_amount),
                "target_date": g.target_date.isoformat() if g.target_date else None,
                "priority": g.priority,
                "status": g.status,
            }
            for g in raw["goals"]
        ]

        loans_data = [
            {
                "id": str(l.id),
                "name": l.name,
                "principal_amount": float(l.principal_amount),
                "outstanding_principal": float(l.outstanding_principal),
                "interest_rate": float(l.interest_rate),
                "tenure_months": l.tenure_months,
                "monthly_emi": float(l.monthly_emi) if l.monthly_emi is not None else None,
                "start_date": l.start_date.isoformat() if l.start_date else None,
            }
            for l in raw["loans"]
        ]

        recurring_bills_data = [
            {
                "id": str(rb.id),
                "name": rb.name,
                "merchant": rb.merchant,
                "category": rb.category,
                "amount": float(rb.amount),
                "frequency": rb.frequency,
                "start_date": rb.start_date.isoformat() if rb.start_date else None,
                "next_due_date": rb.next_due_date.isoformat() if rb.next_due_date else None,
                "status": rb.status,
            }
            for rb in raw["recurring_bills"]
        ]

        notifications_data = [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in raw["notifications"]
        ]

        total_records = (
            len(accounts_data)
            + len(transactions_data)
            + len(budgets_data)
            + len(goals_data)
            + len(loans_data)
            + len(recurring_bills_data)
            + len(notifications_data)
        )

        metadata = DataExportMetadata(
            export_version="1.0",
            exported_at=datetime.now(timezone.utc),
            user_id=user.id,
            email=user.email,
            total_records=total_records,
            data_sections=[
                "accounts",
                "transactions",
                "budgets",
                "goals",
                "loans",
                "recurring_bills",
                "notifications",
            ],
        )

        profile_data = {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "pan_number": mask_pan(user.pan_number),
            "currency": user.currency,
            "monthly_income": float(user.monthly_income) if user.monthly_income is not None else None,
            "risk_appetite": user.risk_appetite,
            "preferences": user.preferences,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }

        # Log audit action
        audit_log_service.log_action(
            db=db,
            user_id=user.id,
            action="DATA_EXPORTED",
            category="data_export",
            ip_address=ip_address,
            user_agent=user_agent,
            details={"format": "json", "total_records": total_records},
        )

        return UserDataExportResponse(
            metadata=metadata,
            profile=profile_data,
            accounts=accounts_data,
            transactions=transactions_data,
            budgets=budgets_data,
            goals=goals_data,
            loans=loans_data,
            recurring_bills=recurring_bills_data,
            notifications=notifications_data,
        )

    @staticmethod
    def export_user_data_csv_zip(
        db: Session,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bytes:
        """Generates a multi-file CSV zip archive containing individual table CSV files."""
        json_export = DataManagementService.export_user_data_json(
            db=db,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # 1. Accounts CSV
            acc_buf = io.StringIO()
            acc_writer = csv.writer(acc_buf)
            acc_writer.writerow(["id", "name", "account_type", "balance", "credit_limit", "currency", "created_at"])
            for a in json_export.accounts:
                acc_writer.writerow([a["id"], a["name"], a["account_type"], a["balance"], a["credit_limit"], a["currency"], a["created_at"]])
            zip_file.writestr("accounts.csv", acc_buf.getvalue())

            # 2. Transactions CSV
            tx_buf = io.StringIO()
            tx_writer = csv.writer(tx_buf)
            tx_writer.writerow(["id", "account_id", "destination_account_id", "amount", "transaction_type", "category", "merchant", "description", "reference", "source", "transaction_date"])
            for t in json_export.transactions:
                tx_writer.writerow([t["id"], t["account_id"], t["destination_account_id"], t["amount"], t["transaction_type"], t["category"], t["merchant"], t["description"], t["reference"], t["source"], t["transaction_date"]])
            zip_file.writestr("transactions.csv", tx_buf.getvalue())

            # 3. Budgets CSV
            b_buf = io.StringIO()
            b_writer = csv.writer(b_buf)
            b_writer.writerow(["id", "name", "category", "amount", "period", "start_date", "end_date"])
            for b in json_export.budgets:
                b_writer.writerow([b["id"], b["name"], b["category"], b["amount"], b["period"], b["start_date"], b["end_date"]])
            zip_file.writestr("budgets.csv", b_buf.getvalue())

            # 4. Goals CSV
            g_buf = io.StringIO()
            g_writer = csv.writer(g_buf)
            g_writer.writerow(["id", "name", "goal_type", "target_amount", "current_amount", "target_date", "priority", "status"])
            for g in json_export.goals:
                g_writer.writerow([g["id"], g["name"], g["goal_type"], g["target_amount"], g["current_amount"], g["target_date"], g["priority"], g["status"]])
            zip_file.writestr("goals.csv", g_buf.getvalue())

            # 5. Loans CSV
            l_buf = io.StringIO()
            l_writer = csv.writer(l_buf)
            l_writer.writerow(["id", "name", "principal_amount", "outstanding_principal", "interest_rate", "tenure_months", "monthly_emi", "start_date"])
            for l in json_export.loans:
                l_writer.writerow([l["id"], l["name"], l["principal_amount"], l["outstanding_principal"], l["interest_rate"], l["tenure_months"], l["monthly_emi"], l["start_date"]])
            zip_file.writestr("loans.csv", l_buf.getvalue())

            # 6. Recurring Bills CSV
            rb_buf = io.StringIO()
            rb_writer = csv.writer(rb_buf)
            rb_writer.writerow(["id", "name", "merchant", "category", "amount", "frequency", "start_date", "next_due_date", "status"])
            for rb in json_export.recurring_bills:
                rb_writer.writerow([rb["id"], rb["name"], rb["merchant"], rb["category"], rb["amount"], rb["frequency"], rb["start_date"], rb["next_due_date"], rb["status"]])
            zip_file.writestr("recurring_bills.csv", rb_buf.getvalue())

        zip_buffer.seek(0)
        return zip_buffer.getvalue()

    @staticmethod
    def delete_user_account(
        db: Session,
        user: User,
        payload: UserDeleteRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AccountDeletionResponse:
        """
        Executes permanent account deletion with strict confirmation.
        Cascades deletion to all financial ledger records.
        """
        if payload.confirm_email.lower().strip() != user.email.lower().strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Confirmation email does not match authenticated user email address.",
            )

        if payload.confirmation_text.strip() != "DELETE MY ACCOUNT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Confirmation text must be exactly 'DELETE MY ACCOUNT'.",
            )

        user_id = user.id
        email = user.email

        logger.warning(
            f"Executing permanent account deletion for user {user_id} ({email}). Reason: {payload.reason}"
        )

        # 1. If user has a linked Clerk identity, revoke and delete it on Clerk first
        if user.clerk_user_id:
            try:
                clerk_service.delete_clerk_user_sync(user.clerk_user_id)
            except Exception as ce:
                logger.error(f"Failed to delete Clerk user {user.clerk_user_id}: {ce}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to revoke external authentication credentials on Clerk. Account deletion aborted to prevent inconsistent identity state.",
                )

        try:
            # 2. Explicitly delete child records in reverse dependency order to ensure uniform cascading across PostgreSQL and SQLite
            db.query(Transaction).filter(Transaction.user_id == user_id).delete(synchronize_session=False)
            db.query(RecurringBill).filter(RecurringBill.user_id == user_id).delete(synchronize_session=False)
            db.query(Budget).filter(Budget.user_id == user_id).delete(synchronize_session=False)
            db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).delete(synchronize_session=False)
            db.query(Loan).filter(Loan.user_id == user_id).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
            db.query(Account).filter(Account.user_id == user_id).delete(synchronize_session=False)

            db.delete(user)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete account for user {user_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while deleting your account. Please try again or contact support.",
            )

        return AccountDeletionResponse(
            status="deleted",
            message="Your account and all associated personal financial data have been permanently deleted.",
            deleted_at=datetime.now(timezone.utc),
            deleted_user_id=user_id,
        )


data_management_service = DataManagementService()
