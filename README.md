# FinSage — AI-Powered Personal Finance Management Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ai--finsage.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-finsage.vercel.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Alpine-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Alembic](https://img.shields.io/badge/Alembic-v1.13+-E32A26?style=for-the-badge)](https://alembic.sqlalchemy.org)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blueviolet?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

FinSage is a production-oriented, intelligent personal wealth management platform that combines deterministic double-entry accounting math, automated statement reconciliation, proactive debt repayment optimization, and grounded generative AI assistance.

**Live Application**: [https://ai-finsage.vercel.app](https://ai-finsage.vercel.app)  
**Repository**: [https://github.com/Ishitadas03/AI-FinSage](https://github.com/Ishitadas03/AI-FinSage)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Screenshots & Demo](#screenshots--demo)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Installation & Local Setup](#installation--local-setup)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [API Documentation](#api-documentation)
- [Authentication & Security](#authentication--security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Progressive Web App (PWA)](#progressive-web-app-pwa)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements & Contact](#acknowledgements--contact)

---

## Project Overview

### What FinSage Is
FinSage is an enterprise-grade personal finance operating system built for individuals, freelancers, and household financial managers who need more than static historical spreadsheets. It pairs high-precision transactional ledger accounting with mathematical amortization engines, automated bank statement duplicate detection, heuristic fraud alerts, and an AI financial assistant grounded strictly in verified ledger numbers.

### The Problem It Solves
Traditional budgeting applications often suffer from four critical deficiencies:
1. **Ledger Inaccuracies**: Manual entry errors and floating-point math issues distort net worth and cash flow calculations.
2. **Reactive Rather Than Proactive**: Most tools show where money went in the past rather than simulating future outcomes (e.g. debt prepayment savings or compounding growth).
3. **AI Hallucinations**: Generic AI financial chatbots invent hypothetical numbers, balances, and savings rates when disconnected from the user's verified database.
4. **Data Privacy & Lifecycle Risks**: Many platforms make it difficult for users to export their records in standard formats or execute a clean, permanent account purge across identity providers and database tables.

### The FinSage Approach: Deterministic Math + Grounded AI
* **Zero Math Hallucination**: All calculations (DTI ratio, emergency fund runway, loan amortization schedules, savings rates, and burn velocity) are computed deterministically in the backend with exact Decimal precision.
* **Grounded Synthesis**: The AI Copilot and Monthly Financial Reports ingest verified database metrics as structured JSON context, guaranteeing that generated recommendations reflect actual transactions without inventing figures.

---

## Key Features

### 1. Financial Accounts & Transaction Ledger
* Multi-account management: Savings, Current/Checking, Credit Card, Cash, and Investment accounts.
* Real-time balance reconciliation with income, expense, and account-to-account transfer transactions.
* Merchant categorization, transaction search, date-range filtering, and pagination.

### 2. Live Spending Analytics & Health Scoring
* Visual category breakdown (Groceries, Utilities, Dining, Travel, Healthcare, Entertainment, etc.).
* Time-series trend analysis, daily burn rate tracking, and fixed vs. discretionary spending categorization.
* **5-Pillar Financial Health Index (0–100 score)**:
  * Savings Rate Pillar
  * Debt-to-Income (DTI) Stress Pillar
  * Emergency Fund Runway Pillar
  * Budget Adherence Pillar
  * Credit Utilization Pillar

### 3. Category Budgets & Financial Goals
* Configurable monthly and period category budgets with live utilization percentages and overrun alerts.
* Structured wealth milestones (Emergency Fund, Home Down Payment, Retirement, Vehicle, Education).
* Goal progress tracking with automated monthly contribution allocations and target date projections.

### 4. Loans, EMIs & Amortization What-If Simulator
* Multi-loan registry (Home Loans, Auto Loans, Personal Loans, Student Loans).
* Exact mathematical monthly EMI computation:
  $$\text{EMI} = P \cdot r \cdot \frac{(1 + r)^n}{(1 + r)^n - 1}$$
* Complete month-by-month principal and interest amortization schedules.
* **Prepayment Simulator**: Interactively tests how extra monthly payments (e.g., $+\text{₹}3,000/\text{mo}$) reduce remaining loan tenure and save lifetime interest liability.

### 5. Bank Statement CSV Import & Duplicate Detection
* Multi-format CSV parser supporting major banking export layouts (HDFC, SBI, ICICI, Axis, Standard Generic).
* Deterministic SHA-256 file fingerprint validation preventing modified file commits.
* Structured preview returning detected layout, valid/invalid rows, normalized dates, and categories.
* User-controlled duplicate handling policies (`skip_duplicates` or `abort_on_duplicate`).

### 6. Grounded AI Copilot & Dynamic Monthly Reports
* Conversational financial intelligence assistant powered by Google Gemini (with OpenAI and local deterministic synthesis fallback).
* Zero-hallucination guarantee: Prompts are tightly bound to user-verified financial aggregates.
* Dynamic monthly financial audit reports featuring period-over-period comparisons, category variance, budget audits, and priority action checklists.

### 7. Recurring Bills & Notification Center
* Scheduled recurring expenses (subscriptions, rent, utilities, insurance) with next due-date tracking.
* In-app notification center alerting users about upcoming bill dates and budget overruns.
* Single-click payment recording that automatically updates linked account balances.

### 8. Scam Shield Heuristic Defense
* Heuristic fraud detection flagging velocity spikes, high-risk merchant categories, anomalous transaction amounts, and off-hour activity.
* Explains the specific risk factor without selling or transmitting data to third parties.

### 9. Data Management, Privacy Controls & Resilient Account Deletion
* Complete data portability: Download full financial ledger as structured JSON or multi-table CSV Zip archives.
* **PAN Data Protection**: Indian PAN input is strictly regex-validated (`^[A-Z]{5}[0-9]{4}[A-Z]{1}$`), masked in responses (`XXXXXX234F`), and redacted from audit logs.
* **3-Phase Resilient Account Deletion**:
  1. *Phase 1 (Lock)*: Account marked as `pending_deletion` in PostgreSQL, blocking all API access.
  2. *Phase 2 (Revoke)*: Revokes external identity on Clerk (idempotent, handling 404 cleanly).
  3. *Phase 3 (Purge)*: Permanently deletes all child records and user profile.
  * Includes automated background reconciliation (`reconcile_pending_deletions`) to resolve partial failure states.
* **Immutable Audit Trail**: Security events, exports, and profile updates are logged in an append-only audit log protected by ORM update interceptors.

### 10. Progressive Web App (PWA)
* Fully responsive desktop, tablet, and mobile interface with offline static caching via service worker (`sw.js`).
* Browser install prompts and standalone app window support.

---

## Screenshots & Demo

> [!NOTE]
> The screenshots below represent the FinSage dashboard and modules. When cloning the repository, you can add updated interface captures to `docs/screenshots/`.

```
+-----------------------------------------------------------------------+
|  FinSage Dashboard Preview                                            |
|  +-----------------------+  +--------------------------------------+  |
|  | Total Net Worth       |  | Monthly Cash Flow                    |  |
|  | ₹12,45,000.00         |  | In: ₹1,50,000  | Out: ₹62,400        |  |
|  +-----------------------+  +--------------------------------------+  |
|                                                                       |
|  [ Spending Analytics ]   [ 5-Pillar Health Score: 84/100 (Grade A) ] |
|  [ EMI What-If Sim    ]   [ AI Financial Copilot Chat & Monthly Rep ] |
+-----------------------------------------------------------------------+
```

* **Live Staging URL**: [https://ai-finsage.vercel.app](https://ai-finsage.vercel.app)
* **API Documentation (Local)**: `http://localhost:8000/docs`

---

## Technology Stack

```mermaid
mindmap
  root((FinSage Tech Stack))
    Frontend
      React 18.3
      TypeScript
      Vite
      Tailwind CSS
      Lucide Icons
      Recharts
      Framer Motion
    Backend
      FastAPI v0.115+
      Python 3.11+ / 3.13
      Pydantic v2
      Uvicorn ASGI
      HTTPX Async
    Database & ORM
      PostgreSQL 16
      SQLAlchemy 2.0
      Alembic Migrations
      Psycopg 3 Driver
    Authentication & Security
      Clerk RS256 JWKS
      Argon2id Password Hashing
      PyJWT HS256 Fallback
      Constant-Time Cron Auth
    AI & Analytics
      Google Gemini 1.5 Flash
      OpenAI Fallback
      Deterministic Engine
    DevOps & Infra
      Vercel Serverless
      Docker & Docker Compose
      Vitest & Testing Library
      Pytest Test Suite
```

### Detailed Breakdown
* **Frontend**: React 18 SPA built with TypeScript and Vite. Styled using Tailwind CSS with glassmorphism dark-mode aesthetics. Data visualizations powered by Recharts.
* **Backend**: FastAPI running on Python 3.11+ with Pydantic v2 request/response validation, dependency injection, and asynchronous route handlers.
* **Database & ORM**: PostgreSQL with SQLAlchemy 2.0 Core/ORM and Alembic schema revision tracking. Connection pooling dynamically adapts between `QueuePool` (local/Docker) and `NullPool` (Vercel Serverless).
* **Authentication**: Clerk RS256 token verification via live JWKS caching with just-in-time (JIT) local database user provisioning, paired with an internal Argon2id/JWT fallback.
* **AI Engine**: Provider-agnostic LLM interface supporting Google Gemini 1.5 Flash, OpenAI `gpt-4o-mini`, and a zero-hallucination local deterministic engine.
* **Testing**: Comprehensive 529-test backend Pytest suite and 112-test frontend Vitest/React Testing Library suite.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client_Layer["Client Layer (SPA & PWA)"]
        BROWSER["Web Browser / PWA"]
        UI["React 18 + Vite SPA"]
        API_CLIENT["Axios Client + Token Interceptor"]
        BROWSER --> UI
        UI --> API_CLIENT
    end

    subgraph Auth_Provider["Authentication & Identity"]
        CLERK["Clerk Auth Service (JWKS RS256)"]
        CLERK_API["Clerk Backend API (User Deletion)"]
    end

    subgraph Backend_Layer["FastAPI Application Services"]
        ROUTER["API Router (/api/v1)"]
        AUTH_DEP["Auth Dependency (deps.py)"]
        ACC_SVC["Account & Ledger Service"]
        TX_SVC["Transaction Service"]
        ANALYTICS_SVC["Spending Analytics Engine"]
        LOAN_SVC["EMI & Amortization Engine"]
        IMPORT_SVC["CSV Parser & Dedup Service"]
        COPILOT_SVC["AI Copilot & Report Service"]
        DATA_SVC["Data Management & 3-Phase Purge"]
        
        ROUTER --> AUTH_DEP
        AUTH_DEP --> ACC_SVC
        AUTH_DEP --> TX_SVC
        AUTH_DEP --> ANALYTICS_SVC
        AUTH_DEP --> LOAN_SVC
        AUTH_DEP --> IMPORT_SVC
        AUTH_DEP --> COPILOT_SVC
        AUTH_DEP --> DATA_SVC
    end

    subgraph Data_Layer["Persistence Layer"]
        PG[(PostgreSQL 16 Database)]
        ALEMBIC["Alembic Migrations (001-016)"]
        AUDIT_LOGS["Immutable Audit Logs Table"]
    end

    subgraph AI_Layer["External AI Providers"]
        GEMINI["Google Gemini 1.5 Flash API"]
        OPENAI["OpenAI API (Fallback)"]
    end

    API_CLIENT -- "Bearer JWT" --> ROUTER
    API_CLIENT -- "Login / OAuth" --> CLERK
    AUTH_DEP -- "Fetch Public JWKS" --> CLERK
    DATA_SVC -- "Revoke User" --> CLERK_API
    
    ACC_SVC --> PG
    TX_SVC --> PG
    DATA_SVC --> PG
    DATA_SVC --> AUDIT_LOGS
    ALEMBIC -.-> PG

    COPILOT_SVC -- "Grounded Context" --> GEMINI
    COPILOT_SVC -. "Fallback" .-> OPENAI
```

---

## Project Directory Structure

```text
AI-FinSage/
├── api/                           # Vercel Monorepo Serverless Entrypoint
│   └── index.py                   # ASGI wrapper exposing FastAPI app
├── backend/                       # Backend Application Root
│   ├── alembic/                   # Alembic Schema Migrations
│   │   ├── versions/              # 16 Sequential Migration Scripts (001 to 016)
│   │   └── env.py                 # Migration environment configuration
│   ├── app/                       # Core FastAPI Codebase
│   │   ├── api/                   # API Endpoints & Dependencies
│   │   │   ├── deps.py            # Authentication & Current User Injection
│   │   │   └── v1/                # Route Handlers (accounts, analytics, copilot, etc.)
│   │   ├── core/                  # Engine Config, Database Session, Security
│   │   ├── models/                # SQLAlchemy ORM Models (User, Transaction, Loan, etc.)
│   │   ├── schemas/               # Pydantic Request/Response DTO Schemas
│   │   └── services/              # Business Logic (EMI math, CSV parser, LLM client, etc.)
│   ├── tests/                     # 529 Automated Pytest Unit & Integration Tests
│   ├── requirements.txt           # Standalone backend dependency manifest
│   ├── Dockerfile                 # Backend Container Image Definition
│   └── alembic.ini                # Alembic CLI configuration
├── frontend/                      # Frontend Application Root
│   ├── public/                    # Static Assets, Icons, and PWA Manifests
│   ├── src/                       # React Application Source
│   │   ├── components/            # UI Components, Modals, Navigation
│   │   ├── context/               # FinanceContext & Application State
│   │   ├── lib/                   # API Client, Token Storage, Formatting
│   │   ├── pages/                 # Route Pages (Dashboard, Spending, AIReport, Settings)
│   │   └── test/                  # 112 Vitest Frontend Unit & Integration Tests
│   ├── package.json               # Frontend dependency manifest
│   ├── vite.config.ts             # Vite bundler configuration
│   └── tailwind.config.ts         # Tailwind CSS design system tokens
├── docker-compose.yml             # Full-Stack Local Multi-Container Orchestration
├── requirements.txt               # Monorepo root dependency manifest for Vercel
├── vercel.json                    # Vercel Monorepo Routing, Headers, and Rewrites
└── README.md                      # Project Documentation
```

---

## Prerequisites

Before running FinSage locally, ensure you have the following tools installed:

| Tool | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | `3.11+` | `3.12` / `3.13` | Required for FastAPI backend |
| **Node.js** | `18.0.0+` | `20.x LTS` | Required for React/Vite frontend |
| **npm** | `9.0.0+` | `10.x` | Package manager |
| **PostgreSQL** | `14.0+` | `16.x` | Or use Docker Compose |
| **Git** | `2.x+` | Latest | Version control |
| **Docker** | `24.x+` | Optional | For automated containerized setup |

---

## Installation & Local Setup

You can run FinSage using either **Option 1: Docker Compose (Fastest)** or **Option 2: Native Manual Setup**.

### Option 1: Docker Compose Orchestration (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ishitadas03/AI-FinSage.git
   cd AI-FinSage
   ```

2. **Start all services with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
   * Frontend: `http://localhost:5173`
   * Backend API: `http://localhost:8000`
   * Swagger Documentation: `http://localhost:8000/docs`
   * PostgreSQL: `localhost:5432`

---

### Option 2: Native Manual Setup

#### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   * On Linux/macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   * On Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure backend environment variables**:
   Create a `.env` file in the `backend/` folder (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   *Ensure `DATABASE_URL` points to your active PostgreSQL instance.*

5. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Start the FastAPI backend server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### 2. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure frontend environment variables**:
   Create a `.env` file in the `frontend/` folder:
   ```bash
   cp .env.example .env
   ```
   *Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` and your `VITE_CLERK_PUBLISHABLE_KEY`.*

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Open your browser and navigate to `http://localhost:5173`.

---

## Environment Variables

FinSage uses separate environment files for the backend (`backend/.env`) and frontend (`frontend/.env`).

> [!WARNING]
> Never commit `.env` or `.env.local` files to version control. Server-side secrets (`CLERK_SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `CRON_SECRET`) must remain strictly on the backend.

### Backend Environment Variables (`backend/.env`)

| Variable | Used By | Purpose | Required | Safe Placeholder / Example |
| :--- | :--- | :--- | :---: | :--- |
| `ENVIRONMENT` | Core Settings | Sets application mode (`development`, `staging`, `production`) | Yes | `development` |
| `DEBUG` | FastAPI Engine | Enables debug logs and SQL echo (set `False` in prod) | No | `True` |
| `DATABASE_URL` | SQLAlchemy / Alembic | PostgreSQL connection URI | Yes | `postgresql+psycopg://postgres:your_password@localhost:5432/finsage_db` |
| `JWT_SECRET_KEY` | Security Engine | High-entropy secret for internal fallback access/refresh tokens ($\ge 32$ chars) | Yes | `your_super_secret_jwt_key_minimum_32_characters_long` |
| `JWT_ALGORITHM` | Security Engine | JWT signing algorithm | No | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Security Engine | Access token validity window | No | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Security Engine | Refresh token validity window | No | `7` |
| `CLERK_ISSUER_URL` | Auth Dependency | Clerk JWKS issuer URL for RS256 token verification | Optional | `https://your-app-domain.clerk.accounts.dev` |
| `CLERK_SECRET_KEY` | Clerk Service | Server-side secret key for revoking Clerk user accounts | Optional | `sk_test_your_clerk_secret_key` |
| `CRON_SECRET` | Maintenance Endpoint | Secret token for authenticating `/maintenance/reconcile-deletions` | Optional | `your_high_entropy_cron_secret_string` |
| `GEMINI_API_KEY` | AI Copilot | Google Gemini API key for grounded synthesis | Optional | `your_gemini_api_key_here` |
| `OPENAI_API_KEY` | AI Copilot | OpenAI API key for fallback chat completions | Optional | `your_openai_api_key_here` |
| `CORS_ORIGINS` | FastAPI Middleware | Comma-separated list of allowed web origins | Yes | `http://localhost:5173,https://ai-finsage.vercel.app` |

### Frontend Environment Variables (`frontend/.env`)

| Variable | Used By | Purpose | Required | Safe Placeholder / Example |
| :--- | :--- | :--- | :---: | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Provider | Public key to initialize Clerk browser authentication | Yes | `pk_test_your_clerk_publishable_key` |
| `VITE_API_BASE_URL` | API Client (`client.ts`) | Target backend API base URL | No | `http://localhost:8000/api/v1` (Defaults to `/api/v1`) |

---

## Database & Migrations

FinSage uses PostgreSQL managed via SQLAlchemy 2.0 and Alembic.

### Entity Relationship Model

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : owns
    USERS ||--o{ TRANSACTIONS : owns
    USERS ||--o{ BUDGETS : defines
    USERS ||--o{ FINANCIAL_GOALS : sets
    USERS ||--o{ LOANS : manages
    USERS ||--o{ RECURRING_BILLS : tracks
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : records
    USERS ||--o{ CHAT_MESSAGES : sends
    ACCOUNTS ||--o{ TRANSACTIONS : ledger
    FINANCIAL_GOALS ||--o{ GOAL_CONTRIBUTIONS : logs

    USERS {
        uuid id PK
        string email UK
        string clerk_user_id UK
        string full_name
        string pan_number
        string currency
        string status
        decimal monthly_income
    }
    ACCOUNTS {
        uuid id PK
        uuid user_id FK
        string name
        string account_type
        decimal balance
        string currency
    }
    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        decimal amount
        string transaction_type
        string category
        string merchant
        datetime transaction_date
    }
    LOANS {
        uuid id PK
        uuid user_id FK
        string name
        decimal principal_amount
        decimal interest_rate
        int tenure_months
        decimal monthly_emi
    }
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string category
        json details
        datetime created_at
    }
```

### Alembic Migration Workflow

1. **Apply all pending migrations to the latest revision**:
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Check current migration version**:
   ```bash
   alembic current
   ```

3. **Rollback one migration revision (Development only)**:
   ```bash
   alembic downgrade -1
   ```

*Total Revisions*: 16 sequential migrations spanning `001_initial_user_model.py` through `016_add_user_status_column.py`.

---

## API Documentation

The FastAPI backend exposes interactive OpenAPI documentation locally at `http://localhost:8000/docs`.

### Key API Routes

#### 1. System Health
* `GET /api/v1/health`: Basic application health check and uptime status.
* `GET /api/v1/health/db`: Database connectivity verification with `SELECT 1` ping and latency metric.

#### 2. User Profile & Data Management
* `GET /api/v1/users/me`: Retrieve persistent user profile (returns masked PAN `XXXXXX234F`).
* `PATCH /api/v1/users/me`: Update application-managed profile fields (currency, monthly income, risk appetite, PAN).
* `GET /api/v1/data-management/export?format=json|csv`: Download complete financial ledger archive.
* `GET /api/v1/data-management/audit-logs`: View paginated user security and data activity trail.
* `POST /api/v1/data-management/delete-account`: Execute permanent 3-phase account deletion.
* `POST /api/v1/data-management/maintenance/reconcile-deletions`: Authenticated cron endpoint to purge pending deletions.

#### 3. Accounts & Transactions
* `GET /api/v1/accounts`: List all accounts owned by the authenticated user.
* `POST /api/v1/accounts`: Create a new financial account.
* `GET /api/v1/transactions`: Search, filter, and paginate user transactions.
* `POST /api/v1/transactions`: Record income, expense, or transfer transaction.

#### 4. Analytics & Financial Health
* `GET /api/v1/analytics/spending`: Aggregate category spending breakdown, time-series trends, and burn rate.
* `GET /api/v1/financial-health`: Calculate 5-pillar health score (0–100) and actionable recommendations.
* `GET /api/v1/debt-stress`: Evaluate debt-to-income (DTI) stress index.

#### 5. Planning: Budgets, Goals, and Loans
* `GET /api/v1/budgets`: Category budget utilization and overrun status.
* `GET /api/v1/goals`: Financial goals progress and milestone projections.
* `GET /api/v1/loans`: Registered loan obligations.
* `POST /api/v1/emi/calculate`: Compute exact EMI and prepayment savings comparison.
* `GET /api/v1/loans/{loan_id}/amortization`: Month-by-month loan repayment schedule.

#### 6. Statement Import
* `POST /api/v1/imports/bank-statement/preview`: Upload and preview CSV bank statement without persisting.
* `POST /api/v1/imports/bank-statement/commit`: Verify SHA-256 hash, detect duplicates, and commit unique transactions.

#### 7. AI Copilot & Dynamic Reports
* `POST /api/v1/copilot/chat`: Conversational AI query grounded strictly in verified ledger data.
* `GET /api/v1/reports/monthly`: Generate comprehensive monthly financial audit report.

---

## Authentication & Security

### 1. Authentication Flow
* **Clerk JWKS Token Verification**: In production and staging, frontend requests supply RS256 Bearer JWTs issued by Clerk. The backend verifies signatures against public keys retrieved from Clerk's JWKS endpoint (`PyJWKClient`).
* **Just-In-Time (JIT) Provisioning**: When a verified Clerk user signs in for the first time, a corresponding user profile is automatically provisioned in PostgreSQL.
* **Internal JWT Fallback**: For development and testing environments, FinSage provides an Argon2id password hashing and HS256 JWT access/refresh token pair.

### 2. Multi-Tenant User Isolation
* Every database entity (`accounts`, `transactions`, `budgets`, `goals`, `loans`, `recurring_bills`, `audit_logs`) includes a mandatory `user_id` foreign key.
* All queries and mutations enforce `WHERE user_id = :current_user_id`, completely mitigating Cross-User / IDOR vulnerabilities.

### 3. Financial Data Masking & Sanitization
* Indian PANs are regex-validated upon input and masked (`XXXXXX234F`) across all public APIs and export files.
* Audit log detail payloads automatically redact sensitive keys (`pan`, `tax_id`, `cvv`, `card_number`, `password`, `token`).

### 4. 3-Phase Account Deletion State Machine
```
[User Initiates Deletion]
          │
          ▼
[Phase 1: PostgreSQL status = 'pending_deletion' & Local Lock]
          │
          ▼
[Phase 2: Revoke Clerk IdP User via Backend API]
          │
          ├── (Success or 404 Already Deleted)
          │         │
          │         ▼
          │   [Phase 3: Purge Child Ledger Records & User Profile]
          │
          └── (Clerk Network/API Failure)
                    │
                    ▼
              [Rollback Status to 'active' & Return HTTP 502 Bad Gateway]
```

---

## Testing

FinSage includes comprehensive test coverage for both backend business logic and frontend component integration.

### Running Backend Tests (`pytest`)

From the repository root or `backend/` directory:
```bash
pytest backend/tests/
```
* **Test Suite**: 529 automated tests across 28 test modules.
* **Coverage**: Account ledger math, EMI amortization calculations, CSV duplicate detection, financial health scoring, AI Copilot grounding, PAN masking, 3-phase account deletion, and Vercel serverless pool configurations.

### Running Frontend Tests (`vitest`)

From the `frontend/` directory:
```bash
cd frontend
npm test -- --run
```
* **Test Suite**: 112 unit and integration tests across 23 test suites.
* **Coverage**: Dashboard widgets, AI Copilot conversation flows, statement import modals, spending charts, and auth token interceptors.

---

## Deployment

### Vercel Serverless Architecture

FinSage is configured as a Vercel monorepo deployment:
* **Frontend**: Built from `frontend/` and served as a static SPA with client-side routing fallback.
* **Backend**: Served via Vercel Python Serverless Functions through `api/index.py`, proxying `/api/(.*)` routes to FastAPI.

```mermaid
flowchart LR
    CLIENT["Browser Client"] --> VERCEL_EDGE["Vercel Edge Network"]
    VERCEL_EDGE -- "/api/*" --> SERVERLESS["Python Serverless Function (api/index.py)"]
    VERCEL_EDGE -- "/*" --> STATIC_SPA["Static Assets & React SPA (frontend/dist)"]
    SERVERLESS -- "NullPool + SSL" --> MANAGED_PG[(Managed PostgreSQL: Neon/Supabase)]
```

### Production Deployment Checklist
1. **Set Environment Variables in Vercel Dashboard** (under Production scope):
   * `ENVIRONMENT=production`
   * `DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname?sslmode=require`
   * `JWT_SECRET_KEY=<32-char-random-secret>`
   * `CLERK_SECRET_KEY=sk_live_...`
   * `CLERK_ISSUER_URL=https://clerk.yourdomain.com`
   * `CRON_SECRET=<random-secret>`
   * `GEMINI_API_KEY=<gemini-api-key>`
   * `CORS_ORIGINS=https://ai-finsage.vercel.app`
2. **Execute Database Migrations**:
   ```bash
   alembic upgrade head
   ```
3. **Deploy Repository**: Push to the production deployment branch on GitHub.

---

## Progressive Web App (PWA)

FinSage is a fully installable Progressive Web App:
* **Offline Asset Caching**: Service worker (`public/sw.js`) caches static bundles, fonts, and application icons.
* **Web App Manifest**: Configured in `public/manifest.json` with standalone display mode and custom icons.
* **Supported Platforms**: Chrome (Desktop/Android), Edge, Safari (iOS Add to Home Screen), and Firefox.

---

## Known Limitations & Roadmap

### Current Limitations
1. **Live Cloud Environment Variables**: The live deployment at `ai-finsage.vercel.app` requires backend environment variables (`DATABASE_URL`, `CLERK_SECRET_KEY`) to be populated in the Vercel dashboard to serve live traffic.
2. **Serverless Cold Starts**: On initial serverless cold starts, Python function initialization may introduce a brief 1–2 second latency before subsequent invocations.

### Planned Roadmap
- [ ] Direct bank account synchronization via Open Banking / Account Aggregator protocols.
- [ ] Multi-currency ledger portfolio conversion with live forex rates.
- [ ] Automated recurring bill payment execution via UPI/NACH mandate webhooks.
- [ ] Shared family / household multi-user ledger workspaces.

---

## Contributing

Contributions are welcome! To contribute to FinSage:

1. **Fork the repository** on GitHub.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m "feat: implement amazing feature"
   ```
4. **Run the test suite** to ensure all tests pass:
   ```bash
   pytest backend/tests/
   cd frontend && npm test -- --run
   ```
5. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements & Contact

* **Lead Architect & Developer**: [Ishita Das](https://github.com/Ishitadas03)
* **GitHub Repository**: [https://github.com/Ishitadas03/AI-FinSage](https://github.com/Ishitadas03/AI-FinSage)
* **Live Application**: [https://ai-finsage.vercel.app](https://ai-finsage.vercel.app)
