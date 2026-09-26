import io
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper to register and login a distinct user, returning user payload and auth headers."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"Import User {uid} {name_suffix}".strip(),
        "email": f"import_user_{uid}_{name_suffix.lower()}@example.com",
        "password": "SecurePassword123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": user_payload["email"],
            "password": user_payload["password"],
        },
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user_data, "token": token, "headers": headers}


# -----------------------------------------------------------------------------
# 1. Authentication Tests
# -----------------------------------------------------------------------------

def test_unauthenticated_upload_rejected():
    csv_bytes = b"Date,Description,Amount\n2024-01-01,Swiggy,-250.00\n"
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        files={"file": ("statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 401


def test_authenticated_upload_debit_credit_success():
    user = register_and_login_user("auth_preview")
    csv_bytes = (
        b"Date,Description,Debit,Credit,Reference\n"
        b"2024-03-15,Swiggy Bangalore,450.00,,UPI123456\n"
        b"2024-03-16,Acme Corp Salary,,75000.00,SAL202403\n"
    )
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("bank_statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["filename"] == "bank_statement.csv"
    assert data["detected_format"] == "debit_credit"
    assert data["total_rows"] == 2
    assert data["valid_rows"] == 2
    assert data["invalid_rows"] == 0
    assert data["preview_count"] == 2
    assert data["has_more_preview_rows"] is False
    assert len(data["normalized_rows"]) == 2
    assert len(data["validation_errors"]) == 0

    row1 = data["normalized_rows"][0]
    assert row1["description"] == "Swiggy Bangalore"
    assert row1["merchant"] == "SWIGGY"
    assert row1["amount"] == "450.00"
    assert row1["type"] == "expense"
    assert row1["category"] is None
    assert row1["reference"] == "UPI123456"

    row2 = data["normalized_rows"][1]
    assert row2["description"] == "Acme Corp Salary"
    assert row2["amount"] == "75000.00"
    assert row2["type"] == "income"
    assert row2["category"] is None
    assert row2["reference"] == "SAL202403"


# -----------------------------------------------------------------------------
# 2. Signed Amount & Header Aliases
# -----------------------------------------------------------------------------

def test_authenticated_upload_signed_amount_success():
    user = register_and_login_user("signed_preview")
    csv_bytes = (
        b"Date,Description,Amount,Reference\n"
        b"2024-03-10,Netflix Subscription,-499.00,TXN9988\n"
        b"2024-03-11,Freelance Client,15000.50,INV001\n"
    )
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("statement_signed.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["detected_format"] == "signed_amount"
    assert data["valid_rows"] == 2
    assert data["normalized_rows"][0]["type"] == "expense"
    assert data["normalized_rows"][0]["amount"] == "499.00"
    assert data["normalized_rows"][0]["merchant"] == "NETFLIX"
    assert data["normalized_rows"][1]["type"] == "income"
    assert data["normalized_rows"][1]["amount"] == "15000.50"


def test_header_aliases_upload():
    user = register_and_login_user("alias_preview")
    csv_bytes = (
        b"Txn Date,Narration,Withdrawals,Deposits,UTR\n"
        b"15/01/2024,Uber Trip,350.00,,UTR9991\n"
    )
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("custom_headers.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid_rows"] == 1
    assert data["detected_format"] == "debit_credit"
    assert data["normalized_rows"][0]["merchant"] == "UBER"
    assert data["normalized_rows"][0]["reference"] == "UTR9991"


# -----------------------------------------------------------------------------
# 3. Mixed Valid / Invalid Rows
# -----------------------------------------------------------------------------

def test_mixed_valid_and_invalid_rows():
    user = register_and_login_user("mixed_preview")
    csv_bytes = (
        b"Date,Description,Debit,Credit\n"
        b"2024-01-01,Valid Debit,100.00,\n"
        b"2024-02-30,Bad Date,200.00,\n"
        b"2024-01-03,Valid Credit,,500.00\n"
        b"2024-01-04,Both Populated,100.00,200.00\n"
        b"2024-01-05,Another Valid,300.00,\n"
    )
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("mixed_statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 5
    assert data["valid_rows"] == 3
    assert data["invalid_rows"] == 2
    assert len(data["validation_errors"]) == 2
    assert data["validation_errors"][0]["row_number"] == 2
    assert data["validation_errors"][1]["row_number"] == 4


# -----------------------------------------------------------------------------
# 4. File Validation & Error Mappings
# -----------------------------------------------------------------------------

def test_empty_csv_file_rejected():
    user = register_and_login_user("empty_csv")
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_whitespace_only_csv_rejected():
    user = register_and_login_user("ws_csv")
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("whitespace.csv", io.BytesIO(b"   \n\n\t  "), "text/csv")},
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_wrong_file_extension_rejected():
    user = register_and_login_user("ext_csv")
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("statement.pdf", io.BytesIO(b"Some PDF content"), "application/pdf")},
    )
    assert res.status_code == 400
    assert "CSV files" in res.json()["detail"]


def test_missing_required_columns_rejected():
    user = register_and_login_user("missing_cols")
    csv_bytes = b"Date,Description,RandomCol\n2024-01-01,Test,Val\n"
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("missing.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 400
    assert "Missing required financial columns" in res.json()["detail"]


def test_row_limit_exceeded_rejected():
    user = register_and_login_user("max_rows")
    rows = [b"Date,Description,Amount"] + [f"2024-01-01,Item {i},10.00".encode("utf-8") for i in range(12)]
    csv_bytes = b"\n".join(rows)

    res = client.post(
        "/api/v1/imports/bank-statement/preview?max_rows=5",
        headers=user["headers"],
        files={"file": ("large.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 413
    assert "exceeding the configured limit" in res.json()["detail"]


# -----------------------------------------------------------------------------
# 5. Preview Limiting & Slicing
# -----------------------------------------------------------------------------

def test_preview_limit_and_pagination_flags():
    user = register_and_login_user("preview_limit")
    rows = [b"Date,Description,Amount"] + [f"2024-01-{i+1:02d},Item {i},10.00".encode("utf-8") for i in range(8)]
    csv_bytes = b"\n".join(rows)

    # Request with preview_limit=3
    res = client.post(
        "/api/v1/imports/bank-statement/preview?preview_limit=3",
        headers=user["headers"],
        files={"file": ("preview_slice.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 8
    assert data["valid_rows"] == 8
    assert data["preview_count"] == 3
    assert data["has_more_preview_rows"] is True
    assert len(data["normalized_rows"]) == 3


def test_preview_limit_all_rows_fit():
    user = register_and_login_user("preview_fit")
    rows = [b"Date,Description,Amount"] + [f"2024-01-{i+1:02d},Item {i},10.00".encode("utf-8") for i in range(3)]
    csv_bytes = b"\n".join(rows)

    # Request with preview_limit=10 (exceeds total valid)
    res = client.post(
        "/api/v1/imports/bank-statement/preview?preview_limit=10",
        headers=user["headers"],
        files={"file": ("preview_fit.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 3
    assert data["valid_rows"] == 3
    assert data["preview_count"] == 3
    assert data["has_more_preview_rows"] is False


# -----------------------------------------------------------------------------
# 6. Security, Isolation & Determinism
# -----------------------------------------------------------------------------

def test_no_database_persistence():
    user = register_and_login_user("isolation_check")

    # Verify 0 transactions exist for this new user
    tx_before = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_before.status_code == 200
    assert tx_before.json()["total"] == 0

    # Call preview API
    csv_bytes = b"Date,Description,Amount\n2024-01-01,Test Item,100.00\n"
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200

    # Verify 0 transactions exist after preview
    tx_after = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_after.status_code == 200
    assert tx_after.json()["total"] == 0


def test_deterministic_repeated_preview():
    user = register_and_login_user("determinism_check")
    csv_bytes = (
        b"Date,Description,Debit,Credit,Reference\n"
        b"2024-01-01,Swiggy Bangalore,450.00,,UPI001\n"
        b"2024-01-02,Client Salary,,50000.00,SAL001\n"
    )
    res1 = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    res2 = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json() == res2.json()


def test_sanitized_filename_no_path_leak():
    user = register_and_login_user("filename_sanitize")
    csv_bytes = b"Date,Description,Amount\n2024-01-01,Item,100.00\n"
    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("C:\\Users\\admin\\secret_passwords\\my_statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 200
    assert res.json()["filename"] == "my_statement.csv"


def test_oversized_file_rejected():
    user = register_and_login_user("oversize_check")
    # Generate content larger than 4 MiB (4 * 1024 * 1024 + 1 bytes)
    oversized_bytes = b"Date,Description,Amount\n" + (b"2024-01-01,Test,10.00\n" * 200000)
    assert len(oversized_bytes) > 4 * 1024 * 1024

    res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("oversized_statement.csv", io.BytesIO(oversized_bytes), "text/csv")},
    )
    assert res.status_code == 413
    assert "exceeds maximum limit of 4MB" in res.json()["detail"]
