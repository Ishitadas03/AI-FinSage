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
│       └── 003_add_accounts_table.py
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
│   │           └── accounts.py  # Financial Accounts CRUD endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings (.env loading)
│   │   ├── database.py          # SQLAlchemy 2.0 engine & session dependency
│   │   └── security.py          # Argon2 hashing & JWT encode/decode/verify
│   ├── models/                  # SQLAlchemy 2.0 DeclarativeBase models
│   │   ├── base.py
│   │   ├── user.py              # User entity (UUID, email, timestamps)
│   │   ├── refresh_session.py   # Refresh token session & revocation tracking
│   │   └── account.py           # Financial Account entity (Numeric balance, isolation)
│   ├── schemas/                 # Pydantic validation models
│   │   ├── user.py
│   │   ├── auth.py
│   │   └── account.py           # Account create/read/update schemas & AccountType
│   └── services/                # Database query & business logic layer
│       └── account_service.py   # Account CRUD and user isolation services
├── tests/                       # Pytest automated test suite
│   ├── test_health.py
│   ├── test_auth.py
│   └── test_accounts.py
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

Apply all migrations (users, refresh_sessions, and accounts):

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

---

## Authentication & Accounts Lifecycle Example

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

### 3. List User Accounts
```bash
curl -X GET http://127.0.0.1:8000/api/v1/accounts \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 4. Update Account
```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/accounts/<ACCOUNT_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "balance": "60000.00"
  }'
```

### 5. Delete Account
```bash
curl -X DELETE http://127.0.0.1:8000/api/v1/accounts/<ACCOUNT_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
