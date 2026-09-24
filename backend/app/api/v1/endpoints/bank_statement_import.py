import os
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.bank_statement_import import BankStatementPreviewResponse
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
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


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
    transaction previews and structured validation errors without persisting any records.
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
        detected_format=parse_result.format_detected,
        total_rows=parse_result.total_rows,
        valid_rows=parse_result.valid_rows,
        invalid_rows=parse_result.invalid_rows,
        preview_count=preview_count,
        has_more_preview_rows=has_more,
        normalized_rows=preview_slice,
        validation_errors=parse_result.validation_errors,
    )
