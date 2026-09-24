from datetime import datetime, timezone
from decimal import Decimal
import hashlib
from typing import List, NamedTuple, Set, Tuple, Union
import uuid
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.schemas.bank_statement_import import (
    DuplicateDetail,
    NormalizedTransactionRow,
)


class DuplicateDetectionResult(NamedTuple):
    total_checked: int
    duplicate_count: int
    duplicate_details: List[DuplicateDetail]
    unique_rows_to_insert: List[Tuple[NormalizedTransactionRow, str]]  # (row, fingerprint)


class BankStatementDuplicateService:
    """Service to deterministically generate fingerprints and detect duplicate transactions."""

    @staticmethod
    def generate_fingerprint(
        account_id: Union[uuid.UUID, str],
        row: NormalizedTransactionRow,
    ) -> str:
        """
        Generate a deterministic SHA-256 fingerprint for a normalized transaction row.
        
        Preferred fingerprint inputs:
        If reference exists:
          account_id | transaction_date | amount | type | normalized reference
        Otherwise:
          account_id | transaction_date | amount | type | normalized merchant | normalized description
        """
        acc_str = str(account_id).lower().strip()

        # Normalize date to UTC formatted string: YYYY-MM-DD HH:MM:SS
        dt = row.transaction_date
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
        date_str = dt.strftime("%Y-%m-%d %H:%M:%S")

        # Normalize amount to fixed 2-decimal string
        amount_str = f"{Decimal(row.amount):.2f}"

        # Normalize transaction type
        tx_type = (row.type.value if hasattr(row.type, "value") else str(row.type)).lower().strip()

        # Check if reference is present
        ref = row.reference.strip().upper() if row.reference and row.reference.strip() else None

        if ref:
            canonical_repr = f"REF|{acc_str}|{date_str}|{amount_str}|{tx_type}|{ref}"
        else:
            merchant_str = row.merchant.strip().upper() if row.merchant and row.merchant.strip() else ""
            desc_str = row.description.strip().upper() if row.description and row.description.strip() else ""
            canonical_repr = f"DESC|{acc_str}|{date_str}|{amount_str}|{tx_type}|{merchant_str}|{desc_str}"

        return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()

    @classmethod
    def analyze_duplicates(
        cls,
        db: Session,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
        rows: List[NormalizedTransactionRow],
    ) -> DuplicateDetectionResult:
        """
        Detect exact duplicate transactions against both the database and within the batch.
        """
        if not rows:
            return DuplicateDetectionResult(
                total_checked=0,
                duplicate_count=0,
                duplicate_details=[],
                unique_rows_to_insert=[],
            )

        # 1. Compute fingerprints for all rows in the batch
        row_fingerprints: List[Tuple[int, NormalizedTransactionRow, str]] = []
        all_fps: Set[str] = set()
        for idx, r in enumerate(rows, start=1):
            fp = cls.generate_fingerprint(account_id, r)
            row_fingerprints.append((idx, r, fp))
            all_fps.add(fp)

        # 2. Query existing fingerprints in DB for this user & account
        existing_db_fps: Set[str] = set()
        if all_fps:
            existing_txs = (
                db.query(Transaction.import_fingerprint)
                .filter(
                    Transaction.user_id == user_id,
                    Transaction.account_id == account_id,
                    Transaction.import_fingerprint.in_(all_fps),
                )
                .all()
            )
            existing_db_fps = {tx.import_fingerprint for tx in existing_txs if tx.import_fingerprint}

        # 3. Classify rows: detect DB duplicates and in-batch duplicates
        seen_in_batch_fps: Set[str] = set()
        duplicate_details: List[DuplicateDetail] = []
        unique_rows_to_insert: List[Tuple[NormalizedTransactionRow, str]] = []

        for row_num, row, fp in row_fingerprints:
            if fp in existing_db_fps:
                duplicate_details.append(
                    DuplicateDetail(
                        row_number=row_num,
                        fingerprint=fp,
                        reason="Transaction with matching fingerprint already exists in account.",
                    )
                )
            elif fp in seen_in_batch_fps:
                duplicate_details.append(
                    DuplicateDetail(
                        row_number=row_num,
                        fingerprint=fp,
                        reason="Duplicate row detected within the same uploaded statement batch.",
                    )
                )
            else:
                seen_in_batch_fps.add(fp)
                unique_rows_to_insert.append((row, fp))

        return DuplicateDetectionResult(
            total_checked=len(rows),
            duplicate_count=len(duplicate_details),
            duplicate_details=duplicate_details,
            unique_rows_to_insert=unique_rows_to_insert,
        )
