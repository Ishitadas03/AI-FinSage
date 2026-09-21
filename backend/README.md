# FinSage Backend API

A high-performance, modular backend foundation built with **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.0**, **Alembic**, and **Pydantic v2**.

---

## Architecture Overview

```
backend/
├── alembic/                      # Database migrations
│   ├── env.py                   # Migration environment configuration
│   ├── script.py.mako           # Migration template
│   └── versions/                # Versioned migration scripts
│       ├── 001_initial_user_model.py
│       ├── 002_add_refresh_sessions.py
│       ├── 003_add_accounts_table.py
│       ├── 004_add_transactions_table.py
│       └── 005_add_destination_account_to_transactions.py
├── alembic.ini                  # Alembic configuration
├── app/
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── api/
│   │   ├── deps.py              # Authorization dependencies (get_current_user)
│   │   └── v1/
│   │       ├── router.py        # API v1 route aggregator
│   │       └── endpoints/
│   │           ├── health.py    # Health and DB ping endpoints
│   │           ├── auth.py      # Registration, Login, /me, Refresh, Logout
│   │           ├── accounts.py  # Financial Accounts CRUD endpoints
│   │           └── transactions.py # Financial Transactions CRUD, filter, & pagination
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings (.env loading)
│   │   ├── database.py          # SQLAlchemy 2.0 engine & session dependency
│   │   └── security.py          # Argon2 hashing & JWT encode/decode/verify
│   ├── models/                  # SQLAlchemy 2.0 DeclarativeBase models
│   │   ├── base.py
│   │   ├── user.py              # User entity (UUID, email, timestamps)
│   │   ├── refresh_session.py   # Refresh token session & revocation tracking
│   │   ├── account.py           # Financial Account entity (Numeric balance, isolation)
│   │   └── transaction.py       # Financial Transaction entity (amount, transfers, category)
│   ├── schemas/                 # Pydantic validation models
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── account.py           # Account create/read/update schemas & AccountType
│   │   └── transaction.py       # Transaction create/read/update schemas & Pagination
│   └── services/                # Database query & business logic layer
│       ├── account_service.py   # Account CRUD, user isolation, and dynamic ledger balances
│       └── transaction_service.py # Transaction CRUD, transfers, multi-filter, cashflow
├── tests/                       # Pytest automated test suite
│   ├── test_health.py
│   ├── test_auth.py
│   ├── test_accounts.py
│   ├── test_transactions.py
│   └── test_ledger.py
├── .env.example                 # Example environment configuration
├── .env                         # Active environment configuration
├── requirements.txt             # Python dependencies
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10+ installed
- PostgreSQL 16 running (via Docker Compose or local instance)

### 2. Start PostgreSQL Container

```bash
docker compose up -d
```

### 3. Set Up Virtual Environment

```bash
cd backend
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run Database Migrations

Apply all migrations (users, refresh_sessions, accounts, and transactions):

```bash
alembic upgrade head
```

### 6. Start the FastAPI Development Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 7. Run Test Suite

```bash
pytest -v
```

---

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root service status and API version info |
| `GET` | `/docs` | Interactive Swagger UI API documentation |
| `GET` | `/redoc` | Interactive ReDoc documentation |
| `GET` | `/api/v1/health` | Service uptime and timestamp health check |
| `GET` | `/api/v1/health/db` | Live PostgreSQL connectivity ping (`SELECT 1`) with latency |

### Authentication (Phase 1B)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account with Argon2id hash | No |
| `POST` | `/api/v1/auth/login` | Authenticate and receive access + refresh JWT tokens | No |
| `GET` | `/api/v1/auth/me` | Retrieve profile of authenticated user | Bearer JWT |
| `POST` | `/api/v1/auth/refresh` | Exchange valid refresh token for rotated token pair | No |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh session in PostgreSQL | No |

### Financial Accounts (Phase 1C)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/accounts` | Create new financial account with Decimal balance | Bearer JWT |
| `GET` | `/api/v1/accounts` | List all accounts belonging to the current user | Bearer JWT |
| `GET` | `/api/v1/accounts/{account_id}` | Retrieve account details by ID (enforces user ownership) | Bearer JWT |
| `PATCH` | `/api/v1/accounts/{account_id}` | Partially update account fields (name, balance, type) | Bearer JWT |
| `DELETE` | `/api/v1/accounts/{account_id}` | Delete account (enforces user ownership) | Bearer JWT |

### Transactions (Phase 2A)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/transactions` | Create new transaction against user's account | Bearer JWT |
| `GET` | `/api/v1/transactions` | List transactions with filters & pagination | Bearer JWT |
| `GET` | `/api/v1/transactions/{transaction_id}` | Retrieve transaction by ID (enforces user ownership) | Bearer JWT |
| `PATCH` | `/api/v1/transactions/{transaction_id}` | Partially update transaction fields & account | Bearer JWT |
| `DELETE` | `/api/v1/transactions/{transaction_id}` | Delete transaction (enforces user ownership) | Bearer JWT |

#### Supported Transaction Query Filters (`GET /api/v1/transactions`)
- `account_id`: Filter by specific account UUID
- `transaction_type`: `income`, `expense`, `transfer`
- `category`: `salary`, `food`, `shopping`, `transport`, `bills`, `rent`, `entertainment`, `healthcare`, `education`, `investment`, `emi`, `insurance`, `cash`, `other`
- `merchant`: Case-insensitive substring match
- `start_date` / `end_date`: ISO 8601 timestamp range (inclusive)
- `min_amount` / `max_amount`: Decimal monetary range
- `page`: Page number (default: 1)
- `page_size`: Page size (default: 20, max: 100)

### Spending Analytics (Phase 3A)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/analytics/overview` | Aggregated metrics, category breakdowns, trends, and top expenses | Bearer JWT |

#### Supported Analytics Query Parameters (`GET /api/v1/analytics/overview`)
- `start_date`: Inclusive start timestamp (defaults to 1st day of current calendar month)
- `end_date`: Inclusive end timestamp (defaults to last day of current calendar month)
- `account_id`: Filter metrics for a specific owned account

### Financial Health (Phase 3B)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/financial-health/overview` | Deterministic financial health foundation metrics grounded in ledger balances | Bearer JWT |

#### Supported Financial Health Query Parameters (`GET /api/v1/financial-health/overview`)
- `start_date`: Inclusive start date (defaults to 30 days prior)
- `end_date`: Inclusive end date (defaults to today)
- `account_id`: Filter metrics for a specific owned account

---

## Authentication, Accounts, Transactions & Analytics Lifecycle Example

### 1. Register User & Login
```bash
# Register
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ishita Das",
    "email": "ishita@example.com",
    "password": "SecurePassword123!"
  }'

# Login to obtain Bearer Token
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ishita@example.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Create Financial Account
```bash
curl -X POST http://127.0.0.1:8000/api/v1/accounts \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HDFC Primary Savings",
    "account_type": "savings",
    "balance": "54250.75",
    "currency": "INR"
  }'
```

### 3. Create Transaction
```bash
curl -X POST http://127.0.0.1:8000/api/v1/transactions \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "<ACCOUNT_ID>",
    "amount": "1250.00",
    "transaction_type": "expense",
    "category": "food",
    "merchant": "Swiggy",
    "description": "Team lunch",
    "transaction_date": "2026-09-21T13:30:00Z"
  }'
```

### 4. Query Spending Analytics Overview
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/analytics/overview" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 5. Update Transaction
```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/transactions/<TRANSACTION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1300.00",
    "description": "Team lunch + drinks"
  }'
```

### 6. Delete Transaction
```bash
curl -X DELETE http://127.0.0.1:8000/api/v1/transactions/<TRANSACTION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
