import hashlib
import os
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.bank_statement_import import (
    BankStatementImportCommitResponse,
    BankStatementPreviewResponse,
    DuplicatePolicy,
)
from app.services.bank_statement_duplicate_service import BankStatementDuplicateService
from app.services.bank_statement_parser_service import (
    BankStatementParserError,
    BankStatementParserService,
    EmptyFileError,
    InvalidCSVError,
    MaxRowsExceededError,
    MissingRequiredColumnsError,
)

router = APIRouter(prefix="/imports/bank-statement", tags=["Bank Statement Import"])

ALLOWED_CSV_EXTENSIONS = (".csv",)
MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024  # 4 MiB limit (Vercel Serverless Function payload compliant)


@router.post(
    "/preview",
    response_model=BankStatementPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Preview Bank Statement CSV Import",
)
async def preview_bank_statement_import(
    file: UploadFile = File(..., description="Bank statement CSV file to preview"),
    preview_limit: int = Query(
        100,
        ge=1,
        le=1000,
        description="Maximum number of normalized rows returned in the preview response",
    ),
    max_rows: int = Query(
        5000,
        ge=1,
        le=10000,
        description="Maximum statement rows allowed for parsing",
    ),
    current_user: User = Depends(get_current_user),
):
    """
    Parse and validate an uploaded bank statement CSV file, returning normalized
    transaction previews, file SHA-256 hash, and structured validation errors without persisting any records.
    """
    # 1. Filename validation
    raw_filename = file.filename or ""
    sanitized_filename = os.path.basename(raw_filename.strip())

    if not sanitized_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing or invalid.",
        )

    if not sanitized_filename.lower().endswith(ALLOWED_CSV_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV files (.csv) are supported.",
        )

    # 2. Read file content safely
    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # 3. File size and empty content checks
    if len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty.",
        )

    if len(content_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # Compute SHA-256 file hash
    file_hash = hashlib.sha256(content_bytes).hexdigest()

    # 4. Invoke deterministic parser service
    parser_service = BankStatementParserService()
    try:
        parse_result = parser_service.parse_csv(
            content=content_bytes,
            max_rows=max_rows,
        )
    except EmptyFileError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except MissingRequiredColumnsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except InvalidCSVError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except MaxRowsExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=str(e),
        )
    except BankStatementParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # 5. Build preview response
    total_valid = parse_result.valid_rows
    preview_slice = parse_result.normalized_rows[:preview_limit]
    preview_count = len(preview_slice)
    has_more = total_valid > preview_count

    return BankStatementPreviewResponse(
        filename=sanitized_filename,
        file_hash=file_hash,
        detected_format=parse_result.format_detected,
        total_rows=parse_result.total_rows,
        valid_rows=parse_result.valid_rows,
        invalid_rows=parse_result.invalid_rows,
        preview_count=preview_count,
        has_more_preview_rows=has_more,
        normalized_rows=preview_slice,
        validation_errors=parse_result.validation_errors,
    )


@router.post(
    "/commit",
    response_model=BankStatementImportCommitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Commit Bank Statement CSV Import",
)
async def commit_bank_statement_import(
    file: UploadFile = File(..., description="Bank statement CSV file to commit"),
    account_id: uuid.UUID = Form(..., description="Target account ID owned by authenticated user"),
    expected_file_hash: str = Form(..., description="SHA-256 hash returned during the preview step"),
    duplicate_policy: DuplicatePolicy = Form(
        DuplicatePolicy.SKIP_DUPLICATES,
        description="Policy for duplicate handling: skip_duplicates or abort_on_duplicate",
    ),
    max_rows: int = Form(
        5000,
        description="Maximum statement rows allowed for parsing",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Re-verifies file SHA-256 integrity, parses statement, analyzes duplicate transactions,
    and commits valid non-duplicate transactions into the selected user account.
    """
    # 1. Filename validation
    raw_filename = file.filename or ""
    sanitized_filename = os.path.basename(raw_filename.strip())

    if not sanitized_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing or invalid.",
        )

    if not sanitized_filename.lower().endswith(ALLOWED_CSV_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV files (.csv) are supported.",
        )

    # 2. Read file content safely
    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # 3. File size and empty content checks
    if len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty.",
        )

    if len(content_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # 4. Verify file SHA-256 hash integrity
    computed_file_hash = hashlib.sha256(content_bytes).hexdigest()
    if computed_file_hash.lower() != expected_file_hash.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="File hash mismatch: uploaded file contents do not match the expected preview file hash.",
        )

    # 5. Verify account ownership strictly for current user
    account = (
        db.query(Account)
        .filter(
            Account.id == account_id,
            Account.user_id == current_user.id,
        )
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified account does not exist or does not belong to the authenticated user.",
        )

    # 6. Parse CSV deterministically (never trust client normalized payload)
    parser_service = BankStatementParserService()
    try:
        parse_result = parser_service.parse_csv(
            content=content_bytes,
            max_rows=max_rows,
        )
    except EmptyFileError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except MissingRequiredColumnsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except InvalidCSVError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except MaxRowsExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=str(e),
        )
    except BankStatementParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # 7. Analyze duplicate transactions
    dup_result = BankStatementDuplicateService.analyze_duplicates(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
        rows=parse_result.normalized_rows,
    )

    # 8. Apply duplicate policy
    if duplicate_policy == DuplicatePolicy.ABORT_ON_DUPLICATE and dup_result.duplicate_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Import aborted: {dup_result.duplicate_count} duplicate transaction(s) detected in statement.",
        )

    # 9. Insert valid unique transactions
    transactions_to_create = []
    for row, fingerprint in dup_result.unique_rows_to_insert:
        tx_type_str = row.type.value if hasattr(row.type, "value") else str(row.type)
        tx = Transaction(
            id=uuid.uuid4(),
            user_id=current_user.id,
            account_id=account_id,
            destination_account_id=None,
            amount=row.amount,
            transaction_type=tx_type_str,
            category=None,
            merchant=row.merchant,
            description=row.description,
            reference=row.reference,
            source="bank_statement_csv",
            import_fingerprint=fingerprint,
            transaction_date=row.transaction_date,
        )
        transactions_to_create.append(tx)

    if transactions_to_create:
        db.add_all(transactions_to_create)
        db.commit()

    total_rows = parse_result.total_rows
    valid_rows = parse_result.valid_rows
    invalid_rows = parse_result.invalid_rows
    duplicate_rows = dup_result.duplicate_count
    imported_rows = len(transactions_to_create)
    skipped_rows = invalid_rows + (duplicate_rows if duplicate_policy == DuplicatePolicy.SKIP_DUPLICATES else 0)

    return BankStatementImportCommitResponse(
        filename=sanitized_filename,
        file_hash=computed_file_hash,
        account_id=account_id,
        total_rows=total_rows,
        valid_rows=valid_rows,
        invalid_rows=invalid_rows,
        duplicate_rows=duplicate_rows,
        imported_rows=imported_rows,
        skipped_rows=skipped_rows,
        duplicate_policy=duplicate_policy,
        validation_errors=parse_result.validation_errors,
        duplicate_details=dup_result.duplicate_details,
    )
