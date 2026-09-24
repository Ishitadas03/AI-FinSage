from datetime import datetime, timezone
from decimal import Decimal
import pytest

from app.schemas.bank_statement_import import (
    BankStatementParseResult,
    NormalizedTransactionRow,
    RowValidationError,
    StatementFormat,
)
from app.schemas.transaction import TransactionType
from app.services.bank_statement_parser_service import (
    BankStatementParserService,
    EmptyFileError,
    InvalidCSVError,
    MaxRowsExceededError,
    MissingRequiredColumnsError,
)


@pytest.fixture
def parser_service() -> BankStatementParserService:
    return BankStatementParserService()


# -----------------------------------------------------------------------------
# 1. Standard Debit / Credit CSV Tests
# -----------------------------------------------------------------------------

def test_standard_debit_credit_csv(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Debit,Credit,Reference\n"
        "2024-03-15,Swiggy Bangalore,450.00,,UPI123456\n"
        "2024-03-16,Salary from Acme Corp,,75000.00,SAL202403\n"
    )
    result = parser_service.parse_csv(csv_content)

    assert isinstance(result, BankStatementParseResult)
    assert result.total_rows == 2
    assert result.valid_rows == 2
    assert result.invalid_rows == 0
    assert len(result.validation_errors) == 0
    assert result.format_detected == StatementFormat.DEBIT_CREDIT
    assert len(result.normalized_rows) == 2

    row1 = result.normalized_rows[0]
    assert row1.transaction_date == datetime(2024, 3, 15, 0, 0, 0, tzinfo=timezone.utc)
    assert row1.description == "Swiggy Bangalore"
    assert row1.merchant == "SWIGGY"
    assert row1.amount == Decimal("450.00")
    assert row1.type == TransactionType.EXPENSE
    assert row1.category is None
    assert row1.reference == "UPI123456"
    assert row1.raw_row["Debit"] == "450.00"

    row2 = result.normalized_rows[1]
    assert row2.transaction_date == datetime(2024, 3, 16, 0, 0, 0, tzinfo=timezone.utc)
    assert row2.description == "Salary from Acme Corp"
    assert row2.amount == Decimal("75000.00")
    assert row2.type == TransactionType.INCOME
    assert row2.category is None
    assert row2.reference == "SAL202403"


# -----------------------------------------------------------------------------
# 2. Signed Amount CSV Tests
# -----------------------------------------------------------------------------

def test_signed_amount_csv(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount,Reference\n"
        "2024-03-10,Netflix Subscription,-499.00,TXN9988\n"
        "2024-03-11,Freelance Payment,15000.50,INV001\n"
    )
    result = parser_service.parse_csv(csv_content)

    assert result.format_detected == StatementFormat.SIGNED_AMOUNT
    assert result.valid_rows == 2
    assert result.invalid_rows == 0

    expense_row = result.normalized_rows[0]
    assert expense_row.type == TransactionType.EXPENSE
    assert expense_row.amount == Decimal("499.00")  # Normalized non-negative magnitude
    assert expense_row.merchant == "NETFLIX"

    income_row = result.normalized_rows[1]
    assert income_row.type == TransactionType.INCOME
    assert income_row.amount == Decimal("15000.50")
    assert income_row.category is None


# -----------------------------------------------------------------------------
# 3. Column Aliases & Headers (Case, Whitespace, Punctuation)
# -----------------------------------------------------------------------------

def test_column_aliases_debit_credit(parser_service: BankStatementParserService):
    csv_content = (
        "Txn Date,Narration,Withdrawals,Deposits,UTR\n"
        "15/01/2024,Uber Trip,350.00,,UTR9991\n"
        "16/01/2024,Client Deposit,,5000.00,UTR9992\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 2
    assert result.format_detected == StatementFormat.DEBIT_CREDIT
    assert result.normalized_rows[0].merchant == "UBER"
    assert result.normalized_rows[0].reference == "UTR9991"


def test_column_aliases_signed_amount(parser_service: BankStatementParserService):
    csv_content = (
        "Transaction Date,Transaction Description,Transaction Amount,Ref No.\n"
        "2024-01-05,Amazon Purchase,-1299.00,REF12345\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 1
    assert result.format_detected == StatementFormat.SIGNED_AMOUNT
    assert result.normalized_rows[0].merchant == "AMAZON"
    assert result.normalized_rows[0].reference == "REF12345"


def test_lowercase_uppercase_and_whitespace_headers(parser_service: BankStatementParserService):
    csv_content = (
        "   DATE   ,   DETAILS   ,   DR AMOUNT (INR)   ,   CR AMOUNT (INR)   \n"
        " 2024-04-01 , Zomato Order , 280.00 , \n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 1
    assert result.normalized_rows[0].description == "Zomato Order"
    assert result.normalized_rows[0].amount == Decimal("280.00")
    assert result.normalized_rows[0].merchant == "ZOMATO"


# -----------------------------------------------------------------------------
# 4. Amount Normalization (Commas, Currency Symbols, Decimals)
# -----------------------------------------------------------------------------

def test_indian_comma_formatted_amounts(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Debit,Credit\n"
        "2024-03-01,Large Purchase,\"1,25,000.50\",\n"
        "2024-03-02,House Sale,,\"12,50,000.00\"\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 2
    assert result.normalized_rows[0].amount == Decimal("125000.50")
    assert result.normalized_rows[1].amount == Decimal("1250000.00")


def test_rupee_and_currency_symbols(parser_service: BankStatementParserService):
    lines = [
        "Date,Description,Amount",
        "2024-02-01,Groceries,₹ -1500.75",
        "2024-02-02,Consulting,Rs. 25000.00",
        "2024-02-03,Bonus,INR 50000",
        "2024-02-04,Software,$ -49.99",
    ]
    csv_content = "\n".join(lines)
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 4
    assert result.normalized_rows[0].amount == Decimal("1500.75")
    assert result.normalized_rows[0].type == TransactionType.EXPENSE
    assert result.normalized_rows[1].amount == Decimal("25000.00")
    assert result.normalized_rows[1].type == TransactionType.INCOME
    assert result.normalized_rows[2].amount == Decimal("50000.00")
    assert result.normalized_rows[3].amount == Decimal("49.99")


def test_accounting_parentheses_amounts(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-02-01,Accounting Expense,(1250.00)\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 1
    assert result.normalized_rows[0].type == TransactionType.EXPENSE
    assert result.normalized_rows[0].amount == Decimal("1250.00")


# -----------------------------------------------------------------------------
# 5. Date Normalization & Edge Cases
# -----------------------------------------------------------------------------

def test_date_formats_supported(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-01-15,ISO Date,100.00\n"
        "25/01/2024,DD/MM/YYYY Date,200.00\n"
        "15-01-2024,DD-MM-YYYY Date,300.00\n"
        "04/25/2024,Unambiguous MM/DD/YYYY,400.00\n"
        "15-Jan-2024,Named Month Date,500.00\n"
        "2024-01-15 14:30:00,Timestamp Date,600.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 6
    assert result.invalid_rows == 0
    assert result.normalized_rows[0].transaction_date == datetime(2024, 1, 15, 0, 0, 0, tzinfo=timezone.utc)
    assert result.normalized_rows[1].transaction_date == datetime(2024, 1, 25, 0, 0, 0, tzinfo=timezone.utc)
    assert result.normalized_rows[2].transaction_date == datetime(2024, 1, 15, 0, 0, 0, tzinfo=timezone.utc)
    assert result.normalized_rows[3].transaction_date == datetime(2024, 4, 25, 0, 0, 0, tzinfo=timezone.utc)
    assert result.normalized_rows[4].transaction_date == datetime(2024, 1, 15, 0, 0, 0, tzinfo=timezone.utc)
    assert result.normalized_rows[5].transaction_date == datetime(2024, 1, 15, 14, 30, 0, tzinfo=timezone.utc)


def test_invalid_dates_produce_row_level_errors(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-02-30,Nonexistent Feb 30,100.00\n"
        "invalid-date,Not a date,200.00\n"
        "99/99/9999,Invalid calendar,300.00\n"
        "2024-03-01,Valid Date,400.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.total_rows == 4
    assert result.valid_rows == 1
    assert result.invalid_rows == 3
    assert len(result.validation_errors) == 3

    assert result.validation_errors[0].row_number == 1
    assert result.validation_errors[0].field == "transaction_date"
    assert result.validation_errors[1].row_number == 2
    assert result.validation_errors[2].row_number == 3


# -----------------------------------------------------------------------------
# 6. Amount Validation & Row-Level Errors
# -----------------------------------------------------------------------------

def test_malformed_amounts_produce_row_level_errors(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-01-01,Alpha Amount,abc\n"
        "2024-01-02,Multiple Dots,12.34.56\n"
        "2024-01-03,Zero Amount,0.00\n"
        "2024-01-04,Valid Row,50.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.total_rows == 4
    assert result.valid_rows == 1
    assert result.invalid_rows == 3
    assert len(result.validation_errors) == 3

    assert result.validation_errors[0].field == "amount"
    assert result.validation_errors[1].field == "amount"
    assert result.validation_errors[2].field == "amount"
    assert "greater than zero" in result.validation_errors[2].error_message


def test_debit_credit_both_populated_error(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Debit,Credit\n"
        "2024-01-01,Conflicting Row,100.00,200.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 0
    assert result.invalid_rows == 1
    assert result.validation_errors[0].field == "debit_credit"
    assert "both debit and credit" in result.validation_errors[0].error_message.lower()


def test_debit_credit_neither_populated_error(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Debit,Credit\n"
        "2024-01-01,Empty Row,0.00,0.00\n"
        "2024-01-02,Dash Row,-,-\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 0
    assert result.invalid_rows == 2
    assert result.validation_errors[0].field == "debit_credit"
    assert result.validation_errors[1].field == "debit_credit"


# -----------------------------------------------------------------------------
# 7. File Validation & Exceptions
# -----------------------------------------------------------------------------

def test_empty_csv_raises_empty_file_error(parser_service: BankStatementParserService):
    with pytest.raises(EmptyFileError):
        parser_service.parse_csv("")

    with pytest.raises(EmptyFileError):
        parser_service.parse_csv("   \n\n\t  ")

    with pytest.raises(EmptyFileError):
        parser_service.parse_csv(b"")


def test_headers_only_csv_raises_empty_file_error(parser_service: BankStatementParserService):
    with pytest.raises(EmptyFileError):
        parser_service.parse_csv("Date,Description,Debit,Credit\n")


def test_missing_required_columns_raises_error(parser_service: BankStatementParserService):
    # Missing debit/credit and amount
    with pytest.raises(MissingRequiredColumnsError) as exc_info:
        parser_service.parse_csv("Date,Description,RandomColumn\n2024-01-01,Test,Value\n")
    assert "Debit + Credit" in str(exc_info.value)

    # Missing date
    with pytest.raises(MissingRequiredColumnsError) as exc_info:
        parser_service.parse_csv("Description,Amount\nTest,100.00\n")
    assert "Date" in str(exc_info.value)


def test_max_rows_exceeded_error(parser_service: BankStatementParserService):
    rows = ["Date,Description,Amount"] + [f"2024-01-01,Item {i},10.00" for i in range(15)]
    csv_content = "\n".join(rows)

    with pytest.raises(MaxRowsExceededError):
        parser_service.parse_csv(csv_content, max_rows=10)


def test_utf8_with_bom_handling(parser_service: BankStatementParserService):
    raw_bytes = "\ufeffDate,Description,Amount\n2024-01-01,BOM Test,100.00\n".encode("utf-8")
    result = parser_service.parse_csv(raw_bytes)
    assert result.valid_rows == 1
    assert result.normalized_rows[0].description == "BOM Test"


# -----------------------------------------------------------------------------
# 8. Description Normalization & Deterministic Merchant Extraction
# -----------------------------------------------------------------------------

def test_description_normalization(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-01-01,\"  Multiple   Spaces   In   Description  \",-150.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 1
    assert result.normalized_rows[0].description == "Multiple Spaces In Description"


def test_deterministic_merchant_extraction(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-01-01,SWIGGY*ORDER123,-250.00\n"
        "2024-01-02,UBER * TRIP 9918,-450.00\n"
        "2024-01-03,ZOMATO-PAYMENT-456,-320.00\n"
        "2024-01-04,POS 4521 STARBUCKS BANGALORE,-350.00\n"
        "2024-01-05,AMAZON PAY INDIA,-999.00\n"
        "2024-01-06,UPI/402918239/Swiggy/HDFC/pay,-200.00\n"
        "2024-01-07,Transfer to John Doe,-5000.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 7

    assert result.normalized_rows[0].merchant == "SWIGGY"
    assert result.normalized_rows[1].merchant == "UBER"
    assert result.normalized_rows[2].merchant == "ZOMATO"
    assert result.normalized_rows[3].merchant == "STARBUCKS"
    assert result.normalized_rows[4].merchant == "AMAZON"
    assert result.normalized_rows[5].merchant == "SWIGGY"
    assert result.normalized_rows[6].merchant is None  # Non-merchant transfer


def test_category_remains_null(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-01-01,Salary Acme Corp,50000.00\n"
        "2024-01-02,Dominos Pizza,-450.00\n"
    )
    result = parser_service.parse_csv(csv_content)
    for row in result.normalized_rows:
        assert row.category is None


# -----------------------------------------------------------------------------
# 9. Determinism and Decimal Precision
# -----------------------------------------------------------------------------

def test_decimal_precision_and_types(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Amount\n"
        "2024-01-01,Item One,0.1\n"
        "2024-01-02,Item Two,0.2\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.valid_rows == 2
    r1 = result.normalized_rows[0].amount
    r2 = result.normalized_rows[1].amount
    assert isinstance(r1, Decimal)
    assert isinstance(r2, Decimal)
    assert r1 + r2 == Decimal("0.30")  # Exact decimal arithmetic, no float inaccuracies


def test_deterministic_repeated_parsing(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Debit,Credit,Ref\n"
        "2024-01-01,Swiggy Bangalore,450.00,,REF1\n"
        "2024-01-02,Client Deposit,,15000.00,REF2\n"
    )
    res1 = parser_service.parse_csv(csv_content)
    res2 = parser_service.parse_csv(csv_content)

    assert res1.model_dump() == res2.model_dump()


def test_mixed_valid_and_invalid_rows(parser_service: BankStatementParserService):
    csv_content = (
        "Date,Description,Debit,Credit\n"
        "2024-01-01,Valid Debit,100.00,\n"
        "2024-02-30,Bad Date,200.00,\n"
        "2024-01-03,Valid Credit,,500.00\n"
        "2024-01-04,Both Populated,100.00,200.00\n"
        "2024-01-05,Another Valid,300.00,\n"
    )
    result = parser_service.parse_csv(csv_content)
    assert result.total_rows == 5
    assert result.valid_rows == 3
    assert result.invalid_rows == 2
    assert len(result.validation_errors) == 2
    assert result.validation_errors[0].row_number == 2
    assert result.validation_errors[1].row_number == 4
