# 🪙 FinSage — AI Financial Copilot & Intelligence Engine

<div align="center">

```
  ███████╗██╗███╗   ██╗███████╗ █████╗  ██████╗ ███████╗
  ██╔════╝██║████╗  ██║██╔════╝██╔══██╗██╔════╝ ██╔════╝
  █████╗  ██║██╔██╗ ██║███████╗███████║██║  ███╗█████╗  
  ██╔══╝  ██║██║╚██╗██║╚════██║██╔══██║██║   ██║██╔══╝  
  ██║     ██║██║ ╚████║███████║██║  ██║╚██████╔╝███████╗
  ╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

**Enterprise-Grade Personal Finance Intelligence, Algorithmic Cash Flow Optimization, and Heuristic Fraud Defense**

[![Live Production](https://img.shields.io/badge/Production%20Deployment-ai--finsage.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-finsage.vercel.app)
[![API Version](https://img.shields.io/badge/FastAPI-v0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/React-18.3%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Database](https://img.shields.io/badge/PostgreSQL-16%20Alpine-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker%20Compose-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Enabled-blueviolet?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[🌐 Live Application](https://ai-finsage.vercel.app) • [📖 Interactive Swagger Docs](https://ai-finsage.vercel.app/docs) • [🐛 Report Issue](https://github.com/Ishitadas03/AI-FinSage/issues) • [✨ Feature Request](https://github.com/Ishitadas03/AI-FinSage/issues)

</div>

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
  - [High-Level Infrastructure Architecture](#high-level-infrastructure-architecture)
  - [Data Ingestion & Analytical Pipeline](#data-ingestion--analytical-pipeline)
  - [Security & Authentication Lifecycle](#security--authentication-lifecycle)
- [Core Feature Matrix](#-core-feature-matrix)
- [Mathematical & Algorithmic Engines](#-mathematical--algorithmic-engines)
  - [1. Future Self Compounding Wealth & Crorepati Engine](#1-future-self-compounding-wealth--crorepati-engine)
  - [2. Debt & EMI Prepayment What-If Engine](#2-debt--emi-prepayment-what-if-engine)
  - [3. 5-Pillar Financial Health Scoring Matrix](#3-5-pillar-financial-health-scoring-matrix)
  - [4. Scam Shield Heuristic Defense Engine](#4-scam-shield-heuristic-defense-engine)
- [Technology Stack](#-technology-stack)
- [Repository & Monorepo Structure](#-repository--monorepo-structure)
- [Local Development & Quickstart](#-local-development--quickstart)
  - [Option 1: Docker Compose Orchestration (Recommended)](#option-1-docker-compose-orchestration-recommended)
  - [Option 2: Native Manual Setup](#option-2-native-manual-setup)
- [Database Migrations (Alembic)](#-database-migrations-alembic)
- [API Reference & Endpoints](#-api-reference--endpoints)
- [Environment Configuration Matrix](#-environment-configuration-matrix)
- [Quality Assurance & Automated Testing](#-quality-assurance--automated-testing)
- [Production Deployment & Security Hardening](#-production-deployment--security-hardening)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Executive Overview

**FinSage** is an intelligent personal financial operating system and analytical copilot designed to bridge the gap between reactive expense tracking and proactive wealth building. 

Traditional finance tools often provide static historical dashboards without forward-looking intelligence. FinSage operates as a continuous financial copilot:
1. **Eliminates Ledger Inaccuracies**: Double-entry balance reconciliation with strict decimal precision and user isolation.
2. **Projects Compounding Trajectories**: Simulates decades of wealth growth incorporating inflation discounting, step-up SIPs, and target retirement milestones.
3. **Optimizes Debt Stress**: Real-time DTI stress testing and amortization what-if simulators proving the exact monetary benefits of extra debt prepayments.
4. **Shields Against Scams**: Heuristic explainable fraud detection flagging velocity spikes, suspicious merchants, and geolocation mismatches.
5. **Generates Executive Health Audits**: Synthesizes 5-pillar health indices with monthly actionable digests.

---

## 🚀 System Architecture & Data Flow

### High-Level Infrastructure Architecture

```mermaid
flowchart TB
    subgraph Client_Layer["🖥️ Client Layer (Frontend SPA & PWA)"]
        UI["React 18 + TypeScript + Vite"]
        PWA["PWA Service Worker & Cache Storage"]
        STATE["FinanceContext + LocalStorage Fallback"]
        CHARTS["Recharts & Framer Motion Engine"]
        UI --> STATE
        STATE --> CHARTS
        UI --> PWA
    end

    subgraph Gateway_Routing["🌐 Routing & Edge Layer"]
        VERCEL["Vercel Edge Network / Reverse Proxy"]
        NGINX["Nginx Gateway (Docker Container)"]
    end

    subgraph Backend_Layer["⚡ Backend API & Business Services (FastAPI)"]
        ROUTER["FastAPI v1 API Router"]
        AUTH_SVC["Authentication & Token Service (Argon2id + JWT)"]
        ACC_SVC["Account & Double-Entry Ledger Service"]
        TXN_SVC["Transaction Ingestion & Filter Engine"]
        ANALYTICS_SVC["Spending & Analytics Engine"]
        HEALTH_SVC["5-Pillar Financial Health Service"]
        LOAN_SVC["EMI & Prepayment Optimization Service"]
        SCAM_SVC["Scam Shield Heuristic Telemetry"]
        
        ROUTER --> AUTH_SVC
        ROUTER --> ACC_SVC
        ROUTER --> TXN_SVC
        ROUTER --> ANALYTICS_SVC
        ROUTER --> HEALTH_SVC
        ROUTER --> LOAN_SVC
        ROUTER --> SCAM_SVC
    end

    subgraph Data_Layer["🗄️ Persistence & Storage (PostgreSQL 16)"]
        PG[(PostgreSQL 16 Engine)]
        TABLES["Users | Accounts | Transactions | RefreshSessions | Loans | Budgets | Goals"]
        ALEMBIC["Alembic Migration Engine"]
        PG --- TABLES
        ALEMBIC --> PG
    end

    Client_Layer -->|HTTPS / JSON API Requests| Gateway_Routing
    Gateway_Routing -->|ASGI Invocation / Proxy Pass| Backend_Layer
    Backend_Layer -->|SQLAlchemy 2.0 Async/Sync ORM| Data_Layer
```

---

### Data Ingestion & Analytical Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User / Bank Statement CSV
    participant UI as 🖥️ React Frontend
    participant API as ⚡ FastAPI Ingestion Endpoint
    participant Ledger as ⚖️ Ledger & Balance Service
    participant DB as 🗄️ PostgreSQL Database
    participant Analytics as 📊 Analytical & Health Engine

    User->>UI: Submit Transaction / Upload Bank Statement
    UI->>API: POST /api/v1/transactions (Bearer JWT)
    API->>API: Validate Schema via Pydantic v2
    API->>Ledger: Compute Account Balance Delta (Double-Entry Safe)
    Ledger->>DB: Atomic Transaction: INSERT tx + UPDATE account balance
    DB-->>Ledger: Transaction Committed (ACID)
    API->>Analytics: Trigger Incremental Health & Category Aggregation
    Analytics-->>API: Recalculated Health Score & Budget Thresholds
    API-->>UI: 201 Created + Updated Account Balances & Insights
    UI->>User: Instant Reactive Dashboard Update with Toast Notification
```

---

### Security & Authentication Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 Web / Mobile Client
    participant AuthAPI as 🔐 Auth Endpoint (/auth/login)
    participant Sec as 🛡️ Core Security (Argon2id / JWT)
    participant DB as 🗄️ PostgreSQL (Refresh Sessions)

    Client->>AuthAPI: POST /api/v1/auth/login {email, password}
    AuthAPI->>DB: Query User by Email
    DB-->>AuthAPI: User record (Argon2id password hash)
    AuthAPI->>Sec: Verify Password with Argon2id
    Sec-->>AuthAPI: Password Validated
    AuthAPI->>Sec: Generate Token Pair (Access Token 30m, Refresh Token 7d)
    AuthAPI->>DB: Store Refresh Session with UUID & Device Metadata
    AuthAPI-->>Client: 200 OK {access_token, refresh_token, token_type: "bearer"}
    
    Note over Client, AuthAPI: Access Token Expired (30 mins later)
    Client->>AuthAPI: POST /api/v1/auth/refresh {refresh_token}
    AuthAPI->>DB: Verify Active Refresh Session (not revoked)
    AuthAPI->>Sec: Rotate Refresh Token & Issue New Access Token
    AuthAPI->>DB: Update Revocation State for Previous Token
    AuthAPI-->>Client: 200 OK (Rotated Token Pair)
```

---

## 💎 Core Feature Matrix

| Feature Module | Capabilities | User Value |
|---|---|---|
| **📊 Executive Dashboard** | • Real-time Net Worth & Monthly Inflow/Outflow<br>• 0–100 Financial Health Gauge<br>• Dual-series Income vs Fixed/Variable expense curves<br>• Category distribution charts | Immediate, high-fidelity visual summary of cash flow health with zero guesswork. |
| **💳 Smart Accounts & Ledger** | • Multi-account support (Savings, Current, Credit Card, Demat, Cash)<br>• Sub-second CRUD & Multi-filter search (Category, Merchant, Date, Amount)<br>• CSV statement ingestion & export | Comprehensive recordkeeping with automated balance reconciliation. |
| **🎯 Future Self Simulator** | • Compound interest projection engine<br>• Inflation rate adjustment (Real vs Nominal wealth)<br>• Annual salary increment step-up modeling<br>• Countdown to Crorepati / Financial Independence milestones | Transforms abstract savings into concrete mathematical timelines to retirement. |
| **📉 Debt & EMI Optimizer** | • Centralized active loan tracking<br>• Debt-to-Income (DTI) risk stress indicator<br>• What-If Prepayment Simulator calculating interest & tenure reductions | Saves thousands in interest payments and slashes debt duration systematically. |
| **🛡️ Scam Shield Defense** | • Heuristic fraud detection with explainable reason tags<br>• Anomaly detection (Velocity spike, untrusted merchant, IP mismatch)<br>• Merchant whitelisting & 1-click dispute templates | Protects against fraudulent charges and provides clear, non-blackbox alerts. |
| **🧠 5-Pillar Health Diagnostics** | • Algorithmic scoring across 5 key dimensions<br>• Historical trajectory tracking<br>• Monthly automated AI executive audits & PDF export | Offers institutional-level diagnostic insights tailored for everyday users. |
| **📈 Market Intel & Schemes** | • Live market indices tracking (Nifty, Sensex, Gold)<br>• Asset allocation rebalancing advisor<br>• Curated socio-financial government scheme discovery | Keeps wealth diversified across equities, debt, and government welfare programs. |

---

## 🧮 Mathematical & Algorithmic Engines

### 1. Future Self Compounding Wealth & Crorepati Engine

FinSage projects compound wealth incorporating step-up contributions and real inflation discounting:

$$\text{Future Value} = P \times (1 + r)^t + \sum_{k=1}^{t} \left[ 12 \times \text{SIP}_k \times (1 + r)^{t - k + 0.5} \right]$$

Where:
- $P$ = Current starting corpus
- $r$ = Real expected annual return rate ($\frac{1 + \text{Nominal Return}}{1 + \text{Inflation}} - 1$)
- $\text{SIP}_k$ = Monthly Systematic Investment in year $k$, stepping up annually: $\text{SIP}_k = \text{SIP}_0 \times (1 + g)^{k-1}$
- $g$ = Annual investment step-up percentage
- $t$ = Investment horizon in years

---

### 2. Debt & EMI Prepayment What-If Engine

Standard Equated Monthly Installment (EMI) calculation:

$$\text{EMI} = \frac{P \times r \times (1 + r)^n}{(1 + r)^n - 1}$$

Where $P$ is principal, $r$ is monthly interest rate, and $n$ is total months.

When an extra prepayment $E$ is made at month $m$:
1. The remaining principal $P_{\text{rem}}$ immediately contracts: $P_{\text{new}} = P_{\text{rem}} - E$.
2. The loan term recalculates:
   $$n_{\text{new}} = \frac{\ln\left(\frac{\text{EMI}}{\text{EMI} - P_{\text{new}} \times r}\right)}{\ln(1 + r)}$$
3. **Total Interest Saved** = $\text{Total Scheduled Interest}_{\text{original}} - \text{Total Interest}_{\text{revised}}$.

---

### 3. 5-Pillar Financial Health Scoring Matrix

The overall Financial Health Score (0–100) is deterministically computed across five weighted dimensions:

$$\text{Score} = w_1 S_{\text{savings}} + w_2 S_{\text{emergency}} + w_3 S_{\text{debt}} + w_4 S_{\text{budget}} + w_5 S_{\text{investment}}$$

```
┌───────────────────────────┬────────┬──────────────────────────────────────────┐
│ Pillar                    │ Weight │ Benchmark Target                         │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ 1. Savings Discipline     │ 25%    │ Savings Rate >= 30% of Net Monthly Inflow│
│ 2. Emergency Readiness    │ 20%    │ Liquid Reserves >= 6 Months Core Expenses│
│ 3. Debt Burden (DTI)      │ 25%    │ Total EMIs <= 30% of Gross Monthly Income │
│ 4. Spending Control       │ 15%    │ Discretionary Spending <= 30% Inflow     │
│ 5. Investment Habit       │ 15%    │ Active Recurring SIPs >= 15% Inflow      │
└───────────────────────────┴────────┴──────────────────────────────────────────┘
```

---

### 4. Scam Shield Heuristic Defense Engine

Each transaction is evaluated through multi-variable risk heuristics:

```mermaid
flowchart LR
    TX[Incoming Transaction] --> R1{Amount Spike?}
    TX --> R2{Velocity Spike?}
    TX --> R3{Untrusted Merchant?}
    TX --> R4{Location Anomaly?}

    R1 -- > 3x Average --> S1[+35 Risk Points]
    R2 -- > 3 Txns in 10m --> S2[+30 Risk Points]
    R3 -- Unverified / High Risk Category --> S3[+25 Risk Points]
    R4 -- Unrecognized Geo/IP --> S4[+20 Risk Points]

    S1 --> SUM[Aggregate Score 0-100]
    S2 --> SUM
    S3 --> SUM
    S4 --> SUM

    SUM --> DECISION{Risk Level}
    DECISION -- Score < 30 --> LOW[✅ Low Risk: Normal]
    DECISION -- 30 <= Score < 70 --> MED[⚠️ Moderate Risk: Flagged]
    DECISION -- Score >= 70 --> HIGH[🚨 High Risk: Action Required]
```

---

## 🛠️ Technology Stack

```
                     ┌──────────────────────────────────────────────┐
                     │               Frontend Stack                 │
                     ├──────────────────────────────────────────────┤
                     │ React 18.3 • TypeScript 5.8 • Vite 5.4      │
                     │ Tailwind CSS • Radix UI • Framer Motion      │
                     │ Recharts • Sonner • TanStack Query • PWA     │
                     └──────────────────────┬───────────────────────┘
                                            │ REST / JSON (JWT / Bearer)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │                Backend Stack                 │
                     ├──────────────────────────────────────────────┤
                     │ FastAPI 0.115 • Python 3.10+ • Pydantic v2   │
                     │ SQLAlchemy 2.0 • Alembic 1.13 • Uvicorn      │
                     │ Argon2id Hashing • PyJWT Cryptography        │
                     └──────────────────────┬───────────────────────┘
                                            │ SQL / ACID Transactions
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │               Database & Infra               │
                     ├──────────────────────────────────────────────┤
                     │ PostgreSQL 16 Alpine • Docker & Compose      │
                     │ Vercel Serverless ASGI • GitHub Actions CI   │
                     └──────────────────────────────────────────────┘
```

---

## 📂 Repository & Monorepo Structure

```
AI-FinSage/
├── .env.example                  # Root environment configuration example
├── docker-compose.yml            # Multi-service container definitions
├── package.json                  # Root scripts for monorepo development
├── requirements.txt              # Root Python dependencies for serverless runtime
├── vercel.json                   # Vercel deployment routes, headers & serverless routing
│
├── api/                          # Vercel Serverless ASGI Bridge
│   └── index.py                  # Serverless function entrypoint exposing FastAPI app
│
├── frontend/                     # React 18 SPA Client
│   ├── public/                   # Manifests, PWA icons, Service Workers
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── auth/             # Login, Register & Session management modals
│   │   │   ├── brand/            # FinSage SVG logos & animated headers
│   │   │   ├── common/           # Shared buttons, badges, card containers
│   │   │   ├── layout/           # Header, SidebarNav, BottomNav, DashboardLayout
│   │   │   ├── modals/           # Add Transaction, Loan Simulation & Goal Modals
│   │   │   ├── pwa/              # Install triggers & offline banner
│   │   │   └── ui/               # shadcn / Radix primitives (Accordion, Dialog, Tabs)
│   │   ├── context/              # FinanceContext (global state) & PWA Context
│   │   ├── hooks/                # Custom React hooks (useMobile, useToast, etc.)
│   │   ├── lib/                  # Utilities & API Clients
│   │   │   ├── api/              # Axios instance, endpoints, token storage
│   │   │   ├── formatters.ts     # Currency (INR/USD), percentages, date formatting
│   │   │   └── utils.ts          # Tailwind class merger (cn)
│   │   ├── pages/                # Application Views
│   │   │   ├── Dashboard.tsx     # Executive financial dashboard
│   │   │   ├── Transactions.tsx  # Dynamic multi-filter ledger & CSV import
│   │   │   ├── Budgets.tsx       # Category budget tracking with threshold alerts
│   │   │   ├── Goals.tsx         # Goal tracker with monthly SIP calculator
│   │   │   ├── FutureSelf.tsx    # Compound wealth & Crorepati simulator
│   │   │   ├── DebtEMI.tsx       # Loan portfolio & Prepayment what-if optimizer
│   │   │   ├── ScamShield.tsx    # Heuristic fraud telemetry & dispute creator
│   │   │   ├── FinancialHealth.tsx # 5-pillar diagnostics & score breakdown
│   │   │   ├── AIReport.tsx      # Automated executive audit digest
│   │   │   ├── MarketIntel.tsx   # Live market indices & asset allocation
│   │   │   ├── Settings.tsx      # User preferences & account configuration
│   │   │   └── Landing.tsx       # Public marketing page
│   │   ├── App.tsx               # Main routing tree & layout wrappers
│   │   └── main.tsx              # Application entrypoint
│   ├── tailwind.config.ts        # Custom FinTech theme colors & animations
│   └── vite.config.ts            # Vite bundler & test configuration
│
└── backend/                      # FastAPI Python Service
    ├── alembic/                  # Database migration management
    │   ├── versions/             # Versioned schema migrations
    │   └── env.py                # Alembic runtime environment
    ├── app/
    │   ├── api/                  # API Routers & Endpoints
    │   │   ├── deps.py           # Dependency injection (get_current_user, get_db)
    │   │   └── v1/
    │   │       ├── router.py     # Aggregated v1 API router
    │   │       └── endpoints/    # Feature endpoints (auth, accounts, transactions, etc.)
    │   ├── core/                 # Core engine
    │   │   ├── config.py         # Pydantic Settings & environment parsing
    │   │   ├── database.py       # SQLAlchemy 2.0 Engine & Sessionmaker
    │   │   └── security.py       # Argon2id password hashing & JWT generation
    │   ├── models/               # SQLAlchemy ORM Models
    │   │   ├── base.py           # DeclarativeBase with UUID & timestamp mixins
    │   │   ├── user.py           # User entity
    │   │   ├── account.py        # Financial account entity (decimal balances)
    │   │   ├── transaction.py    # Transaction entity with category/type enums
    │   │   └── refresh_session.py# Refresh token tracking & revocation
    │   ├── schemas/              # Pydantic v2 Request/Response validation models
    │   │   ├── auth.py           # Login, Register, Token schemas
    │   │   ├── account.py        # Account CRUD schemas
    │   │   ├── transaction.py    # Transaction CRUD & Pagination schemas
    │   │   └── analytics.py      # Spending & Health response schemas
    │   ├── services/             # Pure business logic layer
    │   │   ├── account_service.py # Double-entry balance calculation
    │   │   ├── transaction_service.py # Multi-filter ledger queries
    │   │   └── health_service.py # 5-pillar scoring algorithms
    │   └── main.py               # FastAPI application initialization & middlewares
    ├── tests/                    # Pytest automated test suite
    ├── Dockerfile                # Backend containerization file
    ├── alembic.ini               # Alembic CLI config
    └── requirements.txt          # Python dependencies
```

---

## ⚡ Local Development & Quickstart

### Option 1: Docker Compose Orchestration (Recommended)

Spins up PostgreSQL 16, the FastAPI backend, and the React frontend in isolated, networked containers:

```bash
# 1. Clone the repository
git clone https://github.com/Ishitadas03/AI-FinSage.git
cd AI-FinSage

# 2. Build and start all services in detached mode
docker compose up --build -d

# 3. View live logs across containers
docker compose logs -f
```

#### Access Points:
- 🖥️ **Frontend Web App**: [http://localhost:8080](http://localhost:8080)
- ⚡ **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📚 **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📖 **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- 🗄️ **PostgreSQL Database**: `localhost:5432` (`postgres:postgres`)

---

### Option 2: Native Manual Setup

#### Step 1: Database Setup
Start a local PostgreSQL 16 instance or run via Docker:
```bash
docker run --name finsage-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finsage_db -p 5432:5432 -d postgres:16-alpine
```

#### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Copy environment settings
cp .env.example .env

# Apply database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Step 3: Frontend Setup
```bash
# Open a new terminal in the repository root
cd frontend

# Install Node dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start Vite dev server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🗄️ Database Migrations (Alembic)

Database schemas are strictly version-controlled using Alembic.

```bash
cd backend

# Apply all pending migrations to latest version
alembic upgrade head

# Roll back the most recent migration
alembic downgrade -1

# Generate a new migration after modifying SQLAlchemy models
alembic revision --autogenerate -m "add_new_financial_metric"

# View migration history
alembic history --verbose
```

---

## 📡 API Reference & Endpoints

### 🔐 Authentication & Session Management
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Register new user with Argon2id password hash | ❌ |
| `POST` | `/api/v1/auth/login` | Authenticate credentials and receive Access + Refresh JWTs | ❌ |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | ✅ Bearer |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh token for rotated token pair | ❌ |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh session in PostgreSQL | ❌ |

### 💳 Financial Accounts
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/accounts` | List all accounts owned by current user | ✅ Bearer |
| `POST` | `/api/v1/accounts` | Create new financial account (Savings, Current, Credit, etc.) | ✅ Bearer |
| `GET` | `/api/v1/accounts/{id}` | Get account details and verified ledger balance | ✅ Bearer |
| `PATCH` | `/api/v1/accounts/{id}` | Update account metadata | ✅ Bearer |
| `DELETE`| `/api/v1/accounts/{id}` | Delete account (enforces user ownership) | ✅ Bearer |

### 📝 Transactions & Cash Flow
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/transactions` | Query transactions with multi-parameter filtering & pagination | ✅ Bearer |
| `POST` | `/api/v1/transactions` | Create transaction & reconcile account balance | ✅ Bearer |
| `GET` | `/api/v1/transactions/{id}` | Retrieve transaction details by ID | ✅ Bearer |
| `PATCH` | `/api/v1/transactions/{id}`| Update transaction amount, category, or date | ✅ Bearer |
| `DELETE`| `/api/v1/transactions/{id}`| Delete transaction & restore account balance | ✅ Bearer |

### 📊 Analytics & Health
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/analytics/overview` | Aggregated inflow/outflow, category splits, and trends | ✅ Bearer |
| `GET` | `/api/v1/financial-health/overview` | Grounded 5-pillar health score & diagnostic breakdown | ✅ Bearer |

---

## ⚙️ Environment Configuration Matrix

### Backend Environment Variables (`backend/.env`)
| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `ENVIRONMENT` | Yes | `development` | Runtime mode (`development`, `production`, `testing`) |
| `DEBUG` | No | `True` | Enables detailed stack traces in debug mode |
| `APP_NAME` | No | `FinSage API` | Service identification string |
| `DATABASE_URL` | Yes | `postgresql+psycopg://postgres:postgres@localhost:5432/finsage_db` | PostgreSQL connection URI |
| `JWT_SECRET_KEY` | Yes | *Random 32-byte string* | Secret key for signing JWT tokens |
| `JWT_ALGORITHM` | No | `HS256` | Cryptographic signature algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Access token lifespan |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token lifespan |
| `CORS_ORIGINS` | Yes | `http://localhost:8080,http://localhost:5173,https://ai-finsage.vercel.app` | Allowed CORS origins (comma-separated) |

### Frontend Environment Variables (`frontend/.env.local`)
| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | Yes | `http://127.0.0.1:8000/api/v1` | Base URL for FastAPI backend endpoints |
| `VITE_CLERK_PUBLISHABLE_KEY` | No | `pk_test_...` | Optional Clerk Social Auth publishable key |

---

## 🧪 Quality Assurance & Automated Testing

FinSage maintains a comprehensive automated testing suite across both backend services and frontend components.

```bash
# Run Backend Test Suite (Pytest)
cd backend
pytest -v --disable-warnings

# Run Frontend Unit & Component Tests (Vitest)
cd frontend
npm test

# Run Frontend Type-Check & Linter
npm run lint
```

---

## 🛡️ Production Deployment & Security Hardening

- **OWASP-Compliant Argon2id Hashing**: Password hashing incorporates memory-cost parameters to resist GPU brute-force attacks.
- **Strict User Isolation**: Every database query enforces multi-tenancy filters ensuring zero data bleed between users.
- **Decimal Precision**: All currency calculations avoid floating-point inaccuracies using `Numeric(15, 2)`.
- **Security Headers Injected**:
  - `X-Frame-Options: DENY` (Mitigates Clickjacking)
  - `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🤝 Contributing

Contributions make the open-source community an incredible place to learn, inspire, and create.

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/WealthSimulationEnhancement`)
3. **Commit your Changes** (`git commit -m 'feat: Add Monte Carlo simulation engine'`)
4. **Push to the Branch** (`git push origin feature/WealthSimulationEnhancement`)
5. **Open a Pull Request**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](file:///c:/Users/ishit/AI-FinSage/LICENSE) for full details.

---

<div align="center">

Made with precision & passion by [**Ishita Das**](https://github.com/Ishitadas03) and the FinSage Community.

**[⬆ Back to Top](#-finsage--ai-financial-copilot--intelligence-engine)**

</div>
