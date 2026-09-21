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
├── alembic.ini                  # Alembic configuration
├── app/
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── api/
│   │   └── v1/
│   │       ├── router.py        # API v1 route aggregator
│   │       └── endpoints/
│   │           └── health.py    # Health and DB ping endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings (.env loading)
│   │   └── database.py          # SQLAlchemy 2.0 engine & session dependency
│   ├── models/                  # SQLAlchemy 2.0 DeclarativeBase models
│   │   ├── base.py
│   │   └── user.py              # User entity (UUID, email, timestamps)
│   └── schemas/                 # Pydantic validation models
│       └── user.py
├── .env.example                 # Example environment configuration
├── .env                         # Active environment configuration
├── requirements.txt             # Python dependencies
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10+ installed
- PostgreSQL instance running (locally or hosted via Supabase, Neon, AWS RDS, Docker, etc.)

### 2. Set Up Virtual Environment

```bash
cd backend
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and configure your PostgreSQL connection string:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/finsage_db
```

### 5. Run Database Migrations

Apply the initial migration to create the `users` table:

```bash
alembic upgrade head
```

To roll back a migration:
```bash
alembic downgrade -1
```

### 6. Start the FastAPI Development Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root service status and API version info |
| `GET` | `/docs` | Interactive Swagger UI API documentation |
| `GET` | `/redoc` | Interactive ReDoc documentation |
| `GET` | `/api/v1/health` | Service uptime and timestamp health check |
| `GET` | `/api/v1/health/db` | Live PostgreSQL connectivity ping (`SELECT 1`) with latency |

### Testing Endpoints

#### Basic Health:
```bash
curl -X GET http://127.0.0.1:8000/api/v1/health
```
Response:
```json
{
  "status": "ok",
  "service": "FinSage API",
  "environment": "development",
  "timestamp": "2026-09-21T14:55:00.000000+00:00"
}
```

#### Database Health:
```bash
curl -X GET http://127.0.0.1:8000/api/v1/health/db
```
Response:
```json
{
  "status": "healthy",
  "database": "postgresql",
  "connected": true,
  "latency_ms": 1.42,
  "timestamp": "2026-09-21T14:55:00.000000+00:00"
}
```
