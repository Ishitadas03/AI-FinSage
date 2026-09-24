import csv
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import io
import re
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from app.schemas.bank_statement_import import (
    BankStatementParseResult,
    NormalizedTransactionRow,
    RowValidationError,
    StatementFormat,
)
from app.schemas.transaction import TransactionType


class BankStatementParserError(Exception):
    """Base exception for all bank statement parsing errors."""
    pass


class EmptyFileError(BankStatementParserError):
    """Raised when the uploaded statement file is empty or contains no transaction rows."""
    pass


class InvalidCSVError(BankStatementParserError):
    """Raised when the file cannot be decoded or is not a valid CSV format."""
    pass


class MissingRequiredColumnsError(BankStatementParserError):
    """Raised when mandatory financial columns cannot be identified in the CSV header."""
    def __init__(self, message: str, missing_columns: List[str], found_columns: List[str]):
        super().__init__(message)
        self.missing_columns = missing_columns
        self.found_columns = found_columns


class MaxRowsExceededError(BankStatementParserError):
    """Raised when the statement row count exceeds the configured maximum limit."""
    pass


# Canonical header aliases for column mapping
COLUMN_ALIASES: Dict[str, Set[str]] = {
    "date": {
        "date",
        "transaction date",
        "transaction_date",
        "txn date",
        "txndate",
        "txn_date",
        "value date",
        "val date",
        "value_date",
        "posting date",
        "posting_date",
        "booking date",
        "trans date",
        "trans_date",
        "post date",
        "entry date",
    },
    "description": {
        "description",
        "narration",
        "particulars",
        "details",
        "transaction description",
        "txn description",
        "transaction details",
        "txn details",
        "remarks",
        "note",
        "notes",
        "memo",
        "trans details",
        "payee",
        "beneficiary",
    },
    "debit": {
        "debit",
        "withdrawal",
        "withdrawals",
        "dr",
        "dr amount",
        "dr amt",
        "debit amount",
        "debit amt",
        "withdrawal amount",
        "withdraw",
        "debit inr",
        "debit rs",
        "withdrawal inr",
        "withdrawal rs",
        "payment",
        "payments",
        "money out",
        "debits",
        "debit dr",
        "withdrawal dr",
        "dr debit",
        "dr withdrawal",
    },
    "credit": {
        "credit",
        "deposit",
        "deposits",
        "cr",
        "cr amount",
        "cr amt",
        "credit amount",
        "credit amt",
        "deposit amount",
        "deposit amt",
        "credit inr",
        "credit rs",
        "deposit inr",
        "deposit rs",
        "money in",
        "receipts",
        "credits",
        "credit cr",
        "deposit cr",
        "cr credit",
        "cr deposit",
    },
    "amount": {
        "amount",
        "transaction amount",
        "txn amount",
        "net amount",
        "trans amount",
        "amount inr",
        "amount rs",
        "total amount",
        "sum",
        "amt",
    },
    "reference": {
        "reference",
        "ref no",
        "reference no",
        "ref number",
        "reference number",
        "ref num",
        "transaction id",
        "txn id",
        "trans id",
        "utr",
        "utr no",
        "utr number",
        "cheque no",
        "chq no",
        "check no",
        "ref",
        "txn ref",
        "transaction ref",
        "urn",
        "rrn",
        "chq ref no",
        "cheque ref no",
    },
}

# Known merchant keywords for deterministic extraction
KNOWN_MERCHANTS: List[str] = [
    "SWIGGY",
    "ZOMATO",
    "UBER",
    "OLA",
    "AMAZON",
    "FLIPKART",
    "NETFLIX",
    "SPOTIFY",
    "STARBUCKS",
    "BLINKIT",
    "ZEPTO",
    "BIGBASKET",
    "AIRTEL",
    "JIO",
    "GOOGLE",
    "APPLE",
    "MAKEMYTRIP",
    "IRCTC",
    "MYNTRA",
    "DOMINOS",
    "MCDONALDS",
    "KFC",
    "DUNZO",
    "CRED",
    "PAYTM",
    "PHONEPE",
    "TATA 1MG",
    "APOLLO PHARMACY",
    "BOOKMYSHOW",
    "DECATHLON",
    "IKEA",
    "CULTFIT",
    "URBAN COMPANY",
    "NYKAA",
    "AJIO",
    "DMART",
    "RELIANCE RETAIL",
    "BB DAILY",
    "TATACLIQ",
]


class BankStatementParserService:
    """Service to parse, validate, and normalize bank statement CSV files."""

    DEFAULT_MAX_ROWS: int = 5000

    def parse_csv(
        self,
        content: Union[str, bytes],
        max_rows: int = DEFAULT_MAX_ROWS,
    ) -> BankStatementParseResult:
        """
        Parse CSV content into a deterministic, normalized statement parse result.
        
        Args:
            content: Raw CSV string or bytes.
            max_rows: Maximum allowed data rows.
            
        Returns:
            BankStatementParseResult containing normalized rows and row-level errors.
            
        Raises:
            EmptyFileError: When content is empty or contains no data rows.
            InvalidCSVError: When content cannot be decoded or parsed as CSV.
            MissingRequiredColumnsError: When essential financial columns cannot be identified.
            MaxRowsExceededError: When row count exceeds max_rows.
        """
        # Step 1: Decode and validate content
        text_content = self._decode_content(content)
        if not text_content or not text_content.strip():
            raise EmptyFileError("The uploaded CSV file is empty.")

        # Step 2: Parse CSV structure
        try:
            reader = csv.reader(io.StringIO(text_content))
            all_rows = list(reader)
        except Exception as e:
            raise InvalidCSVError(f"Failed to parse CSV file: {str(e)}") from e

        if not all_rows:
            raise EmptyFileError("The uploaded CSV file is empty.")

        # Filter out completely empty rows (whitespace-only lines)
        header_row_idx: Optional[int] = None
        for i, row in enumerate(all_rows):
            if any(cell.strip() for cell in row):
                header_row_idx = i
                break

        if header_row_idx is None:
            raise EmptyFileError("The uploaded CSV file contains no data or headers.")

        raw_headers = all_rows[header_row_idx]
        data_rows = [r for r in all_rows[header_row_idx + 1 :] if any(cell.strip() for cell in r)]

        if not data_rows:
            raise EmptyFileError("The CSV file contains headers but no transaction rows.")

        if len(data_rows) > max_rows:
            raise MaxRowsExceededError(
                f"File contains {len(data_rows)} data rows, exceeding the configured limit of {max_rows}."
            )

        # Step 3: Column detection and format determination
        col_indices, statement_format = self._detect_columns(raw_headers)

        # Step 4: Process rows
        normalized_rows: List[NormalizedTransactionRow] = []
        validation_errors: List[RowValidationError] = []

        # Build header name mapping for raw_row dictionary
        clean_header_names = [h.strip() if h.strip() else f"col_{idx}" for idx, h in enumerate(raw_headers)]

        for row_idx, row_values in enumerate(data_rows, start=1):
            # Pad row if shorter than header count
            padded_row = row_values + [""] * max(0, len(raw_headers) - len(row_values))

            # Store raw row key-value map
            raw_row_data = {
                clean_header_names[i]: padded_row[i].strip() if i < len(padded_row) else ""
                for i in range(len(raw_headers))
            }

            row_errors: List[RowValidationError] = []

            # Extract raw cell strings
            date_raw = padded_row[col_indices["date"]].strip() if col_indices.get("date") is not None and col_indices["date"] < len(padded_row) else ""
            desc_raw = padded_row[col_indices["description"]].strip() if col_indices.get("description") is not None and col_indices["description"] < len(padded_row) else ""
            ref_raw = (
                padded_row[col_indices["reference"]].strip()
                if col_indices.get("reference") is not None and col_indices["reference"] < len(padded_row)
                else ""
            )

            # A. Parse and validate Date
            parsed_date: Optional[datetime] = None
            if not date_raw:
                row_errors.append(
                    RowValidationError(
                        row_number=row_idx,
                        field="transaction_date",
                        error_message="Transaction date is missing or empty.",
                        raw_value=date_raw,
                    )
                )
            else:
                try:
                    parsed_date = self._parse_date(date_raw)
                except ValueError as err:
                    row_errors.append(
                        RowValidationError(
                            row_number=row_idx,
                            field="transaction_date",
                            error_message=str(err),
                            raw_value=date_raw,
                        )
                    )

            # B. Parse and validate Amount & Transaction Type
            tx_amount: Optional[Decimal] = None
            tx_type: Optional[TransactionType] = None

            if statement_format == StatementFormat.DEBIT_CREDIT:
                debit_raw = padded_row[col_indices["debit"]].strip() if col_indices.get("debit") is not None and col_indices["debit"] < len(padded_row) else ""
                credit_raw = padded_row[col_indices["credit"]].strip() if col_indices.get("credit") is not None and col_indices["credit"] < len(padded_row) else ""

                parsed_debit: Optional[Decimal] = None
                parsed_credit: Optional[Decimal] = None
                debit_err: Optional[str] = None
                credit_err: Optional[str] = None

                if debit_raw and debit_raw != "-":
                    try:
                        parsed_debit = self._parse_amount(debit_raw)
                    except ValueError as err:
                        debit_err = str(err)

                if credit_raw and credit_raw != "-":
                    try:
                        parsed_credit = self._parse_amount(credit_raw)
                    except ValueError as err:
                        credit_err = str(err)

                if debit_err:
                    row_errors.append(
                        RowValidationError(
                            row_number=row_idx,
                            field="debit",
                            error_message=debit_err,
                            raw_value=debit_raw,
                        )
                    )
                if credit_err:
                    row_errors.append(
                        RowValidationError(
                            row_number=row_idx,
                            field="credit",
                            error_message=credit_err,
                            raw_value=credit_raw,
                        )
                    )

                if not debit_err and not credit_err:
                    debit_val = parsed_debit if parsed_debit is not None else Decimal("0.00")
                    credit_val = parsed_credit if parsed_credit is not None else Decimal("0.00")

                    if debit_val > Decimal("0.00") and credit_val > Decimal("0.00"):
                        row_errors.append(
                            RowValidationError(
                                row_number=row_idx,
                                field="debit_credit",
                                error_message="Both debit and credit amounts are populated in the same row.",
                                raw_value=f"Debit: {debit_raw}, Credit: {credit_raw}",
                            )
                        )
                    elif debit_val > Decimal("0.00"):
                        tx_amount = debit_val
                        tx_type = TransactionType.EXPENSE
                    elif credit_val > Decimal("0.00"):
                        tx_amount = credit_val
                        tx_type = TransactionType.INCOME
                    else:
                        row_errors.append(
                            RowValidationError(
                                row_number=row_idx,
                                field="debit_credit",
                                error_message="Row has neither debit nor credit amount populated.",
                                raw_value=f"Debit: '{debit_raw}', Credit: '{credit_raw}'",
                            )
                        )

            elif statement_format == StatementFormat.SIGNED_AMOUNT:
                amount_raw = padded_row[col_indices["amount"]].strip() if col_indices.get("amount") is not None and col_indices["amount"] < len(padded_row) else ""
                if not amount_raw:
                    row_errors.append(
                        RowValidationError(
                            row_number=row_idx,
                            field="amount",
                            error_message="Transaction amount is missing or empty.",
                            raw_value=amount_raw,
                        )
                    )
                else:
                    try:
                        raw_amount_dec = self._parse_amount(amount_raw)
                        if raw_amount_dec > Decimal("0.00"):
                            tx_amount = raw_amount_dec
                            tx_type = TransactionType.INCOME
                        elif raw_amount_dec < Decimal("0.00"):
                            tx_amount = abs(raw_amount_dec)
                            tx_type = TransactionType.EXPENSE
                        else:
                            row_errors.append(
                                RowValidationError(
                                    row_number=row_idx,
                                    field="amount",
                                    error_message="Transaction amount must be strictly greater than zero.",
                                    raw_value=amount_raw,
                                )
                            )
                    except ValueError as err:
                        row_errors.append(
                            RowValidationError(
                                row_number=row_idx,
                                field="amount",
                                error_message=str(err),
                                raw_value=amount_raw,
                            )
                        )

            # C. Normalize Description and Reference
            clean_desc = self._normalize_description(desc_raw)
            clean_merchant = self._extract_merchant(desc_raw)
            clean_ref = self._clean_reference(ref_raw) if ref_raw else None

            # D. Assemble row or record errors
            if row_errors:
                validation_errors.extend(row_errors)
            else:
                assert parsed_date is not None
                assert tx_amount is not None
                assert tx_type is not None

                normalized_row = NormalizedTransactionRow(
                    transaction_date=parsed_date,
                    description=clean_desc,
                    merchant=clean_merchant,
                    amount=tx_amount,
                    type=tx_type,
                    category=None,
                    reference=clean_ref,
                    raw_row=raw_row_data,
                )
                normalized_rows.append(normalized_row)

        detected_col_map = {
            canonical: raw_headers[idx].strip()
            for canonical, idx in col_indices.items()
            if idx is not None and idx < len(raw_headers)
        }

        return BankStatementParseResult(
            total_rows=len(data_rows),
            valid_rows=len(normalized_rows),
            invalid_rows=len(data_rows) - len(normalized_rows),
            normalized_rows=normalized_rows,
            validation_errors=validation_errors,
            format_detected=statement_format,
            detected_columns=detected_col_map,
        )

    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------

    def _decode_content(self, content: Union[str, bytes]) -> str:
        """Decode byte content with UTF-8 / UTF-8 with BOM or fallback encoding."""
        if isinstance(content, str):
            return content

        if not isinstance(content, (bytes, bytearray)):
            raise InvalidCSVError("Content must be string or bytes.")

        for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
            try:
                return content.decode(enc)
            except (UnicodeDecodeError, LookupError):
                continue

        raise InvalidCSVError("Failed to decode file content with supported encodings.")

    def _normalize_header_name(self, header: str) -> str:
        """Normalize header string by stripping, lowercasing, and removing punctuation."""
        lowered = header.strip().lower()
        # Remove currency labels in parentheses or words like (inr), (rs), in inr
        lowered = re.sub(r"\b(?:in\s+)?(?:inr|rs\.?|usd|eur|gbp|cad|aud)\b", "", lowered)
        # Replace punctuation like '.', '_', '-', '/', '(', ')', '[', ']', ':', '#', '*' with space
        cleaned = re.sub(r"[\._\-\/\(\)\[\]\:\#\*\,]", " ", lowered)
        # Collapse multi-spaces
        return re.sub(r"\s+", " ", cleaned).strip()

    def _detect_columns(self, headers: List[str]) -> Tuple[Dict[str, int], StatementFormat]:
        """
        Identify canonical columns from raw CSV headers.
        
        Returns:
            Tuple of (detected_indices_dict, statement_format).
            
        Raises:
            MissingRequiredColumnsError: If required columns cannot be determined.
        """
        detected: Dict[str, Optional[int]] = {
            "date": None,
            "description": None,
            "debit": None,
            "credit": None,
            "amount": None,
            "reference": None,
        }

        normalized_headers = [self._normalize_header_name(h) for h in headers]

        # Match columns against canonical aliases
        for idx, norm_name in enumerate(normalized_headers):
            if not norm_name:
                continue
            for canonical, alias_set in COLUMN_ALIASES.items():
                if detected[canonical] is None and (norm_name in alias_set or any(norm_name == alias for alias in alias_set)):
                    detected[canonical] = idx
                    break

        # Fallback keyword checks for any unmatched fields
        if detected["description"] is None:
            for idx, norm_name in enumerate(normalized_headers):
                if any(w in norm_name for w in ["narration", "description", "particular", "details", "remark"]):
                    detected["description"] = idx
                    break

        if detected["debit"] is None:
            for idx, norm_name in enumerate(normalized_headers):
                if any(w in norm_name.split() for w in ["debit", "dr", "withdrawal", "withdrawals"]):
                    detected["debit"] = idx
                    break

        if detected["credit"] is None:
            for idx, norm_name in enumerate(normalized_headers):
                if any(w in norm_name.split() for w in ["credit", "cr", "deposit", "deposits"]):
                    detected["credit"] = idx
                    break

        if detected["amount"] is None and (detected["debit"] is None or detected["credit"] is None):
            for idx, norm_name in enumerate(normalized_headers):
                if "amount" in norm_name or "amt" in norm_name:
                    if idx != detected["debit"] and idx != detected["credit"]:
                        detected["amount"] = idx
                        break

        # Check Date column
        missing: List[str] = []
        if detected["date"] is None:
            missing.append("Date")

        # Check Description column
        if detected["description"] is None:
            missing.append("Description/Narration")

        # Determine statement format
        has_debit_credit = detected["debit"] is not None and detected["credit"] is not None
        has_amount = detected["amount"] is not None

        if has_debit_credit:
            statement_format = StatementFormat.DEBIT_CREDIT
        elif has_amount:
            statement_format = StatementFormat.SIGNED_AMOUNT
        else:
            missing.append("Debit + Credit columns OR Amount column")
            statement_format = StatementFormat.SIGNED_AMOUNT

        if missing:
            found_summary = [f"'{headers[i].strip()}'" for i in range(len(headers)) if headers[i].strip()]
            raise MissingRequiredColumnsError(
                f"Missing required financial columns: {', '.join(missing)}. Detected columns: {', '.join(found_summary) or 'None'}",
                missing_columns=missing,
                found_columns=found_summary,
            )

        # Filter out None values for indices dictionary
        active_indices = {k: v for k, v in detected.items() if v is not None}
        return active_indices, statement_format

    def _parse_date(self, date_str: str) -> datetime:
        """
        Deterministically parse date string into a datetime object.
        
        Supports standard ISO, DD/MM/YYYY, DD-MM-YYYY, named month formats, and unambiguous MM/DD/YYYY.
        Rejects invalid or ambiguous calendar dates.
        """
        cleaned = date_str.strip().strip("'\"")
        if not cleaned:
            raise ValueError("Date string is empty.")

        # Check numeric slash/dash date for unambiguous MM/DD/YYYY vs DD/MM/YYYY
        # Format: num1 [/-.] num2 [/-.] num3
        m = re.match(r"^(\d{1,2})([/\-\.])(\d{1,2})\2(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$", cleaned)
        if m:
            first_num, sep, second_num, year_part, hr, mn, sc = m.groups()
            n1 = int(first_num)
            n2 = int(second_num)
            year = int(year_part)
            if year < 100:
                year += 2000

            # If first number > 12 and second number <= 12: unambiguously DD/MM/YYYY
            if n1 > 12 and 1 <= n2 <= 12:
                day, month = n1, n2
            # If second number > 12 and first number <= 12: unambiguously MM/DD/YYYY
            elif n2 > 12 and 1 <= n1 <= 12:
                month, day = n1, n2
            # Standard DD/MM/YYYY convention for bank statements
            elif 1 <= n1 <= 31 and 1 <= n2 <= 12:
                day, month = n1, n2
            else:
                raise ValueError(f"Invalid calendar date values: '{cleaned}'")

            hour = int(hr) if hr else 0
            minute = int(mn) if mn else 0
            second = int(sc) if sc else 0

            try:
                return datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)
            except ValueError as e:
                raise ValueError(f"Invalid date: '{cleaned}' ({str(e)})") from e

        # List of standard formats to try
        date_formats = [
            # ISO formats
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%Y.%m.%d",
            # Named months (e.g., 15 Jan 2024, 15-Jan-2024, Jan 15, 2024)
            "%d-%b-%Y",
            "%d %b %Y",
            "%d/%b/%Y",
            "%d-%B-%Y",
            "%d %B %Y",
            "%d/%B/%Y",
            "%b %d, %Y",
            "%B %d, %Y",
            "%b %d %Y",
            "%B %d %Y",
            "%d-%b-%y",
            "%d %b %y",
            "%d/%b/%y",
        ]

        for fmt in date_formats:
            try:
                dt = datetime.strptime(cleaned, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue

        raise ValueError(f"Unrecognized or invalid date format: '{cleaned}'")

    def _parse_amount(self, amount_str: str) -> Decimal:
        """
        Parse and sanitize monetary string to Decimal with 2 decimal places precision.
        
        Handles:
        - Indian commas: '1,25,000.50'
        - Western commas: '125,000.50'
        - Currency symbols: '₹', '$', '€', '£', 'Rs.', 'Rs', 'INR'
        - Accounting parenthesis for negative: '(500.00)' -> '-500.00'
        - Negative signs in prefix or suffix
        - Surrounding whitespace
        """
        if not amount_str or not amount_str.strip():
            raise ValueError("Amount string is empty.")

        val = amount_str.strip()

        # Handle accounting parentheses: '(123.45)' -> '-123.45'
        is_negative = False
        if val.startswith("(") and val.endswith(")"):
            is_negative = True
            val = val[1:-1].strip()

        # Remove currency words and symbols (case-insensitive)
        val = re.sub(r"(?i)\b(?:inr|usd|eur|gbp|cad|aud)\b", "", val)
        val = re.sub(r"(?i)\brs(?:\.|\b)", "", val)
        val = re.sub(r"[₹$€£\u20b9]", "", val)
        val = val.replace(",", "")
        val = val.strip()

        # Check for negative signs (leading or trailing e.g. '123.45-')
        if val.endswith("-"):
            is_negative = True
            val = val[:-1].strip()
        elif val.startswith("-"):
            is_negative = True
            val = val[1:].strip()
        elif val.startswith("+"):
            val = val[1:].strip()

        # Validate numeric format: only digits and optional single decimal point
        if not re.match(r"^\d+(\.\d+)?$", val):
            raise ValueError(f"Malformed monetary value: '{amount_str}'")

        if is_negative:
            val = f"-{val}"

        try:
            dec = Decimal(val).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            return dec
        except (InvalidOperation, Exception) as e:
            raise ValueError(f"Malformed monetary value: '{amount_str}'") from e

    def _normalize_description(self, desc: Optional[str]) -> Optional[str]:
        """Clean description by trimming and collapsing multiple whitespace."""
        if not desc:
            return None
        cleaned = re.sub(r"\s+", " ", desc).strip()
        if not cleaned:
            return None
        return cleaned[:500]

    def _clean_reference(self, ref_str: Optional[str]) -> Optional[str]:
        """Sanitize reference / transaction ID."""
        if not ref_str:
            return None
        cleaned = re.sub(r"\s+", " ", ref_str).strip()
        if not cleaned or cleaned == "-":
            return None
        return cleaned[:255]

    def _extract_merchant(self, description: Optional[str]) -> Optional[str]:
        """
        Deterministically extract merchant name from description using rule-based patterns.
        
        Returns uppercase merchant name if identifiable with high confidence, otherwise None.
        No ML or LLM is used.
        """
        if not description or not description.strip():
            return None

        desc_upper = description.strip().upper()

        # 1. Match known merchant keywords as standalone words or prominent prefixes
        for merchant in KNOWN_MERCHANTS:
            # Pattern: word boundary before and after, or attached to delimiter like *, -, /, _
            pattern = rf"(?:^|[\s\*\-/_]){re.escape(merchant)}(?:$|[\s\*\-/_])"
            if re.search(pattern, desc_upper):
                return merchant

        # 2. Check delimiter prefix patterns like 'SWIGGY*ORDER123' or 'UBER * TRIP'
        delimit_match = re.match(r"^([A-Z0-9]{3,20})\s*[\*]\s*", desc_upper)
        if delimit_match:
            candidate = delimit_match.group(1).strip()
            # Avoid generic transaction channel prefixes as merchant name
            if candidate not in {"POS", "UPI", "NEFT", "IMPS", "ACH", "BILLDESK", "PAYTM", "RTGS", "INB", "MOB", "TPT", "E-COMM"}:
                return candidate

        # 3. Check UPI patterns like 'UPI/402918239/Swiggy/HDFC/...' or 'UPI-SWIGGY-1234'
        upi_match = re.match(r"^UPI[/\-][^/\-]+[/\-]([A-Z0-9\s]{3,25})[/\-]", desc_upper)
        if upi_match:
            candidate = upi_match.group(1).strip()
            if candidate and not candidate.isdigit():
                return candidate

        # 4. Check POS pattern like 'POS 4521 SWIGGY BANGALORE'
        pos_match = re.match(r"^POS\s+(?:\d+\s+)?([A-Z0-9]{3,20})\b", desc_upper)
        if pos_match:
            candidate = pos_match.group(1).strip()
            if candidate and not candidate.isdigit() and candidate not in {"IN", "BANGALORE", "MUMBAI", "DELHI"}:
                return candidate

        return None
