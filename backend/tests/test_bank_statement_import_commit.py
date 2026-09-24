from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import io
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.account import Account
from app.models.transaction import Transaction

client = TestClient(app)


def register_and_login_user(name_suffix: str = "") -> dict:
    """Helper to register and login a distinct user, returning user payload and auth headers."""
    uid = uuid.uuid4().hex[:8]
    user_payload = {
        "full_name": f"Commit User {uid} {name_suffix}".strip(),
        "email": f"commit_user_{uid}_{name_suffix.lower()}@example.com",
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


def create_account(user: dict, name: str = "Primary Savings") -> dict:
    """Helper to create a bank account for a user."""
    res = client.post(
        "/api/v1/accounts",
        headers=user["headers"],
        json={
            "name": name,
            "account_type": "savings",
            "balance": "50000.00",
            "currency": "INR",
        },
    )
    assert res.status_code == 201
    return res.json()


# -----------------------------------------------------------------------------
# 1. Authentication Tests
# -----------------------------------------------------------------------------

def test_unauthenticated_commit_rejected():
    csv_bytes = b"Date,Description,Amount\n2024-01-01,Item,100.00\n"
    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        data={
            "account_id": str(uuid.uuid4()),
            "expected_file_hash": hashlib.sha256(csv_bytes).hexdigest(),
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("stmt.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 401


# -----------------------------------------------------------------------------
# 2. File Integrity Tests
# -----------------------------------------------------------------------------

def test_file_hash_mismatch_rejected():
    user = register_and_login_user("hash_mismatch")
    account = create_account(user)

    csv_bytes = b"Date,Description,Amount\n2024-01-01,Swiggy,-250.00\n"
    wrong_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": wrong_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("stmt.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 409
    assert "hash mismatch" in res.json()["detail"].lower()


def test_preview_to_commit_file_hash_workflow():
    user = register_and_login_user("preview_commit_flow")
    account = create_account(user)

    csv_bytes = (
        b"Date,Description,Debit,Credit,Reference\n"
        b"2024-03-15,Swiggy Bangalore,450.00,,UPI001\n"
        b"2024-03-16,Acme Salary,,75000.00,SAL001\n"
    )

    # 1. Preview
    preview_res = client.post(
        "/api/v1/imports/bank-statement/preview",
        headers=user["headers"],
        files={"file": ("statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert "file_hash" in preview_data
    file_hash = preview_data["file_hash"]

    # 2. Commit using the returned file_hash
    commit_res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert commit_res.status_code == 201
    commit_data = commit_res.json()
    assert commit_data["total_rows"] == 2
    assert commit_data["valid_rows"] == 2
    assert commit_data["imported_rows"] == 2
    assert commit_data["duplicate_rows"] == 0
    assert commit_data["skipped_rows"] == 0


# -----------------------------------------------------------------------------
# 3. Account Ownership & Cross-User Security
# -----------------------------------------------------------------------------

def test_cross_user_account_rejected():
    user1 = register_and_login_user("user_one")
    user2 = register_and_login_user("user_two")
    account2 = create_account(user2)

    csv_bytes = b"Date,Description,Amount\n2024-01-01,Test,100.00\n"
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    # User 1 attempts to import transactions into User 2's account
    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user1["headers"],
        data={
            "account_id": account2["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("stmt.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 404
    assert "not exist" in res.json()["detail"].lower() or "not found" in res.json()["detail"].lower()


def test_nonexistent_account_rejected():
    user = register_and_login_user("nonexistent_acc")
    csv_bytes = b"Date,Description,Amount\n2024-01-01,Test,100.00\n"
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": str(uuid.uuid4()),
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("stmt.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 404


# -----------------------------------------------------------------------------
# 4. Successful Import & Field Provenance
# -----------------------------------------------------------------------------

def test_successful_import_and_data_integrity():
    user = register_and_login_user("data_integrity")
    account = create_account(user, "Savings")

    csv_bytes = (
        b"Date,Description,Debit,Credit,Reference\n"
        b"2024-03-15,Swiggy Bangalore,450.00,,UPI1234\n"
        b"2024-03-16,Bonus Deposit,,12000.00,DEP5678\n"
    )
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    commit_res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("bank_statement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert commit_res.status_code == 201

    # Verify transactions in GET /transactions API
    tx_res = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_res.status_code == 200
    txs = tx_res.json()["items"]
    assert len(txs) == 2

    expense_tx = next(t for t in txs if t["transaction_type"] == "expense")
    assert expense_tx["account_id"] == account["id"]
    assert expense_tx["amount"] == "450.00"
    assert expense_tx["merchant"] == "SWIGGY"
    assert expense_tx["description"] == "Swiggy Bangalore"
    assert expense_tx["reference"] == "UPI1234"
    assert expense_tx["source"] == "bank_statement_csv"
    assert expense_tx["category"] is None  # Must remain NULL for Phase 5B ML categorization

    income_tx = next(t for t in txs if t["transaction_type"] == "income")
    assert income_tx["account_id"] == account["id"]
    assert income_tx["amount"] == "12000.00"
    assert income_tx["description"] == "Bonus Deposit"
    assert income_tx["reference"] == "DEP5678"
    assert income_tx["source"] == "bank_statement_csv"
    assert income_tx["category"] is None


def test_signed_amount_import_success():
    user = register_and_login_user("signed_import")
    account = create_account(user)

    csv_bytes = (
        b"Date,Description,Amount,Reference\n"
        b"2024-03-10,Netflix,-499.00,TXN1\n"
        b"2024-03-11,Dividends,2500.00,TXN2\n"
    )
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("signed.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["imported_rows"] == 2

    tx_res = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_res.status_code == 200
    txs = tx_res.json()["items"]
    assert len(txs) == 2


# -----------------------------------------------------------------------------
# 5. Invalid Rows Handling
# -----------------------------------------------------------------------------

def test_mixed_valid_and_invalid_rows_commit():
    user = register_and_login_user("mixed_commit")
    account = create_account(user)

    csv_bytes = (
        b"Date,Description,Debit,Credit\n"
        b"2024-01-01,Valid Debit,100.00,\n"
        b"2024-02-30,Bad Date,200.00,\n"
        b"2024-01-03,Valid Credit,,500.00\n"
        b"2024-01-04,Both Populated,100.00,200.00\n"
    )
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("mixed.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_rows"] == 4
    assert data["valid_rows"] == 2
    assert data["invalid_rows"] == 2
    assert data["imported_rows"] == 2
    assert data["skipped_rows"] == 2
    assert len(data["validation_errors"]) == 2

    # Verify only the 2 valid transactions are in DB
    tx_res = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_res.json()["total"] == 2


# -----------------------------------------------------------------------------
# 6. Duplicate Detection & Policies (skip vs abort)
# -----------------------------------------------------------------------------

def test_duplicate_policy_skip_duplicates():
    user = register_and_login_user("skip_dup")
    account = create_account(user)

    csv_bytes = (
        b"Date,Description,Amount,Reference\n"
        b"2024-01-01,Swiggy,-250.00,REF1\n"
        b"2024-01-02,Salary,50000.00,REF2\n"
    )
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    # First commit: 2 imported
    res1 = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("stmt.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res1.status_code == 201
    assert res1.json()["imported_rows"] == 2
    assert res1.json()["duplicate_rows"] == 0

    # Second commit of exact same file: 0 imported, 2 skipped as duplicates
    res2 = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("stmt.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["imported_rows"] == 0
    assert data2["duplicate_rows"] == 2
    assert data2["skipped_rows"] == 2
    assert len(data2["duplicate_details"]) == 2

    # Verify DB still only contains 2 transactions total
    tx_res = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_res.json()["total"] == 2


def test_duplicate_policy_abort_on_duplicate():
    user = register_and_login_user("abort_dup")
    account = create_account(user)

    csv_bytes_1 = b"Date,Description,Amount,Reference\n2024-01-01,Existing Txn,-100.00,REF_EXIST\n"
    hash_1 = hashlib.sha256(csv_bytes_1).hexdigest()

    # Initial commit of 1 transaction
    res1 = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": hash_1,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("first.csv", io.BytesIO(csv_bytes_1), "text/csv")},
    )
    assert res1.status_code == 201
    assert res1.json()["imported_rows"] == 1

    # Second statement with 1 existing (duplicate) and 1 new row
    csv_bytes_2 = (
        b"Date,Description,Amount,Reference\n"
        b"2024-01-01,Existing Txn,-100.00,REF_EXIST\n"
        b"2024-01-02,Brand New Txn,-200.00,REF_NEW\n"
    )
    hash_2 = hashlib.sha256(csv_bytes_2).hexdigest()

    # Commit with abort_on_duplicate
    res2 = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": hash_2,
            "duplicate_policy": "abort_on_duplicate",
        },
        files={"file": ("second.csv", io.BytesIO(csv_bytes_2), "text/csv")},
    )
    assert res2.status_code == 409
    assert "duplicate transaction(s) detected" in res2.json()["detail"]

    # Verify transactional rollback: REF_NEW was NOT partially committed
    tx_res = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_res.json()["total"] == 1
    assert tx_res.json()["items"][0]["reference"] == "REF_EXIST"


def test_in_batch_duplicate_handling():
    user = register_and_login_user("in_batch_dup")
    account = create_account(user)

    # CSV containing exact duplicate row within the same file
    csv_bytes = (
        b"Date,Description,Amount,Reference\n"
        b"2024-01-01,Zomato Order,-300.00,ZOM001\n"
        b"2024-01-01,Zomato Order,-300.00,ZOM001\n"
        b"2024-01-02,Coffee,-150.00,COF001\n"
    )
    file_hash = hashlib.sha256(csv_bytes).hexdigest()

    res = client.post(
        "/api/v1/imports/bank-statement/commit",
        headers=user["headers"],
        data={
            "account_id": account["id"],
            "expected_file_hash": file_hash,
            "duplicate_policy": "skip_duplicates",
        },
        files={"file": ("dup_batch.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_rows"] == 3
    assert data["valid_rows"] == 3
    assert data["duplicate_rows"] == 1
    assert data["imported_rows"] == 2
    assert data["skipped_rows"] == 1

    tx_res = client.get("/api/v1/transactions", headers=user["headers"])
    assert tx_res.json()["total"] == 2
