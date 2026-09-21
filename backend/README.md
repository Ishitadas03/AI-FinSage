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
│       └── 002_add_refresh_sessions.py
├── alembic.ini                  # Alembic configuration
├── app/
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── api/
│   │   ├── deps.py              # Authorization dependencies (get_current_user)
│   │   └── v1/
│   │       ├── router.py        # API v1 route aggregator
│   │       └── endpoints/
│   │           ├── health.py    # Health and DB ping endpoints
│   │           └── auth.py      # Registration, Login, /me, Refresh, Logout
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings (.env loading)
│   │   ├── database.py          # SQLAlchemy 2.0 engine & session dependency
│   │   └── security.py          # Argon2 hashing & JWT encode/decode/verify
│   ├── models/                  # SQLAlchemy 2.0 DeclarativeBase models
│   │   ├── base.py
│   │   ├── user.py              # User entity (UUID, email, timestamps)
│   │   └── refresh_session.py   # Refresh token session & revocation tracking
│   └── schemas/                 # Pydantic validation models
│       ├── user.py
│       └── auth.py
├── tests/                       # Pytest automated test suite
│   ├── test_health.py
│   └── test_auth.py
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

Apply all migrations (users and refresh_sessions):

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

---

## Authentication Lifecycle Example

### 1. Register User
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ishita Das",
    "email": "ishita@example.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Login
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ishita@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Access Protected Route (`/auth/me`)
```bash
curl -X GET http://127.0.0.1:8000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 4. Refresh Token
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<REFRESH_TOKEN>"}'
```

### 5. Logout / Revoke Session
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<REFRESH_TOKEN>"}'
```
