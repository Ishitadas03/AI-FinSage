# 🪙 FinSage — AI Financial Copilot & Intelligence Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ai--finsage.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-finsage.vercel.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Smarter Money. Calmer Mind. Brighter Tomorrow.**

*A full-stack, enterprise-grade personal finance copilot engineered to eliminate money anxiety, optimize cash flow, shield against fraud, and simulate compounding paths to financial freedom.*

[Explore Live App](https://ai-finsage.vercel.app) · [Report Bug](https://github.com/Ishitadas03/AI-FinSage/issues) · [Request Feature](https://github.com/Ishitadas03/AI-FinSage/issues)

</div>

---

## 🌟 Executive Overview

**FinSage** bridges the gap between everyday personal accounting and predictive wealth intelligence. Combining modern web technologies with high-performance Python microservices, FinSage gives individuals, freelancers, and families actionable, 360-degree control over their financial universe:

- 📊 **Dynamic Cash Flow & Ledger**: Multi-account ledger with sub-second CRUD, CSV statement importing, and live balance reconciliations.
- 🎯 **Goal Architecture & Future Simulator**: Compound interest simulation engines computing inflation-adjusted retirement timelines and Crorepati milestones.
- 📉 **Debt & EMI What-If Engine**: Loan amortization stress tester calculating exact interest savings and tenure reduction via prepayment optimizations.
- 🛡️ **Scam Shield & Heuristic Defense**: Explainable AI fraud detection analyzing transaction velocities, merchant risk telemetry, and geolocation anomalies.
- 🧠 **5-Pillar Financial Health Diagnostics**: Deterministic scores (0–100) evaluating Savings Discipline, Emergency Readiness, Debt Load, Spending Control, and Investment Habit.
- 📑 **AI Monthly Audits**: Instant executive commentary summaries, budget deviation reports, and exportable audit documents.

---

## 🚀 System Architecture

```
AI-FinSage/
├── frontend/                     # React 18 + Vite + Tailwind + TypeScript Client
│   ├── src/
│   │   ├── components/           # UI Components (Radix UI, shadcn, custom FinTech widgets)
│   │   │   ├── auth/             # Clerk & JWT Authentication modals
│   │   │   ├── brand/            # FinSage dynamic logos, badge components
│   │   │   ├── layout/           # Header, SidebarNav, BottomNav, DashboardLayout
│   │   │   ├── modals/           # Add Transaction, Loan Prepayment, Goal Create
│   │   │   └── pwa/              # Install prompts & Offline status indicators
│   │   ├── context/              # FinanceContext & PWA State Providers
│   │   ├── hooks/                # Custom React hooks (analytics, theme, mobile detection)
│   │   ├── lib/                  # API Client, Axios interceptors, Token storage, Formatters
│   │   └── pages/                # Dashboard, Ledger, Budgets, FutureSelf, ScamShield, etc.
│   ├── public/                   # PWA Manifests, service workers, static brand assets
│   └── vite.config.ts            # Vite bundler configuration
│
├── backend/                      # FastAPI + SQLAlchemy 2.0 + PostgreSQL Core
│   ├── alembic/                  # Versioned Database Migration Scripts
│   ├── app/
│   │   ├── api/v1/endpoints/     # REST Endpoints (Auth, Accounts, Transactions, Analytics, Loans, etc.)
│   │   ├── core/                 # App Settings, Security (Argon2id, JWT), Database Engine
│   │   ├── models/               # SQLAlchemy Declarative Models (User, Account, Transaction, Session)
│   │   ├── schemas/              # Pydantic v2 Request/Response validation schemas
│   │   └── services/             # Core business logic, ledger reconciliation, statistical analytics
│   ├── tests/                    # Pytest test suite (Unit & Integration tests)
│   └── requirements.txt          # Python dependencies
│
├── api/                          # Vercel Serverless Python entrypoint (ASGI bridge)
├── docker-compose.yml            # Multi-container orchestration (PostgreSQL + FastAPI + Nginx)
└── vercel.json                   # Unified production deployment & security header rules
```

---

## 💻 Tech Stack & Infrastructure

### Frontend Client
| Technology | Description |
|---|---|
| **React 18** | High-performance UI rendering with hooks & functional architecture |
| **TypeScript** | Strict compile-time type safety across the entire application |
| **Vite** | Ultra-fast HMR and optimized production bundling |
| **Tailwind CSS** | Custom FinTech design system with rich dark/light theme palettes |
| **Radix UI & shadcn/ui** | Accessible, unstyled UI primitives styled with Tailwind |
| **Framer Motion** | Micro-animations, interactive transitions, and layout morphing |
| **Recharts** | Reactive time-series cash-flow graphs, bar distributions, and gauges |
| **Clerk & JWT** | Dual-mode authentication (Clerk social auth + self-hosted JWT) |
| **PWA (Progressive Web App)**| Offline caching, installable web application, mobile native feel |

### Backend API & Database
| Technology | Description |
|---|---|
| **FastAPI** | Modern, asynchronous, high-throughput Python 3.10+ framework |
| **PostgreSQL 16** | ACID-compliant relational data store with Decimal monetary precision |
| **SQLAlchemy 2.0** | Next-generation declarative ORM with explicit transaction boundaries |
| **Alembic** | Automated, version-controlled database schema migrations |
| **Pydantic v2** | High-speed data parsing, sanitization, and schema validation |
| **Argon2id & PyJWT** | State-of-the-art password hashing and cryptographic token rotation |
| **Uvicorn** | Lightning-fast ASGI production web server |

---

## ⚡ Key Features

### 1. 📊 Executive Dashboard & Cash Flow
- **Key Metrics at a Glance**: Live Net Worth, Monthly Inflow, Outflow, and Savings Rate.
- **Financial Health Dial**: Multi-dimensional 0–100 health index with historical score tracking.
- **Dual-Series Cash Flow**: Monthly trend visualizer contrasting guaranteed income against fixed/variable expenses.
- **Interactive Breakdown**: Dynamic visual distribution of expenses by category with drill-down views.

### 2. 💳 Smart Ledger & Transaction Control
- **Multi-Account Support**: Track Checking, Savings, Credit Cards, Demat/Investment, and Cash wallets.
- **Advanced Query Engine**: Instant filtering by transaction type (`income`, `expense`, `transfer`), category, merchant, date range, and monetary value.
- **Statement Import / Export**: Parse standard bank CSV statements and export filtered accounting ledgers.
- **Double-Entry Balance Updates**: Account balances automatically stay reconciled on transaction changes.

### 3. 🎯 Projections & Compound Wealth Simulator
- **Future Self Simulator**: Interactive compound wealth engine calculating inflation-adjusted projections, annual salary step-ups, and Crorepati milestone countdowns.
- **Smart Financial Goals**: Track short-term and long-term milestones (Emergency Fund, Down Payment, Travel) with calculated monthly SIP requirements.
- **Proactive Category Budgets**: Monthly spending caps with automated visual threshold warnings (80% warning / 100% breach).

### 4. 📉 Debt & EMI What-If Optimizer
- **Loan Portfolio Overview**: Real-time aggregation of active EMIs, total outstanding principal, and average interest rate.
- **Debt-to-Income (DTI) Stress Testing**: Risk evaluation against recommended debt thresholds (<35% Safe, 35-50% Moderate, >50% Critical).
- **Prepayment Simulator**: Calculates exact interest savings and months shaved off loans by making lump-sum or recurring prepayments.

### 5. 🛡️ Scam Shield (Heuristic Fraud Defense)
- **Explainable Anomaly Alerts**: Flags suspicious charges with clear, non-black-box rationale tags (e.g. Velocity Spikes, Untrusted Merchant, Geolocation Anomalies).
- **Forensic Telemetry**: Simulates risk scores, IP geography, device fingerprint verification, and one-click incident reporting.
- **Merchant Whitelisting**: Safely mark trusted recurring vendors to prevent false positives.

### 6. 🧠 AI Audits & Market Intelligence
- **AI Monthly Audit Reports**: Executive summary diagnostics, positive spending highlights, areas of leakage, and action checklists.
- **Market Intel**: Live market index tracking (Nifty 50, Sensex, Gold), asset allocation portfolio balance, and government subsidy recommendations.

---

## 🛠️ Quickstart Guide

### Prerequisites
- **Node.js** 18+ and **npm** / **bun**
- **Python** 3.10+ (for local backend development)
- **Docker & Docker Compose** (optional, for complete containerized setup)

---

### Option A: Docker Compose (Recommended - Full Stack)

Run the complete stack (PostgreSQL + FastAPI Backend + React Frontend/Nginx) with one command:

```bash
# Clone the repository
git clone https://github.com/Ishitadas03/AI-FinSage.git
cd AI-FinSage

# Launch all services
docker compose up --build -d
```

- **Frontend App**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL**: `localhost:5432`

---

### Option B: Local Manual Setup

#### 1. Start PostgreSQL (or use Docker for DB only)
```bash
docker run --name finsage-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finsage_db -p 5432:5432 -d postgres:16-alpine
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start Vite development server
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) (or the port specified in terminal).

---

## 📖 Environment Variables Configuration

### Backend (`backend/.env`)
```ini
ENVIRONMENT=development
DEBUG=True
APP_NAME=FinSage API
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/finsage_db

# Security & Tokens
JWT_SECRET_KEY=generate_a_secure_32_byte_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000,https://ai-finsage.vercel.app
```

### Frontend (`frontend/.env.local`)
```ini
# FastAPI Backend Base URL
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

# Optional Clerk Authentication Integration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## 🧪 Testing

### Backend Unit & Integration Tests (Pytest)
```bash
cd backend
pytest -v --disable-warnings
```
*Covers health endpoints, user registration/login, JWT rotation, account isolation, transaction pagination, and financial analytics.*

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

---

## 🚢 Deployment

### Deploying to Vercel (Unified Monorepo)
FinSage is configured out-of-the-box for zero-friction Vercel deployment:
1. Push your repository to GitHub.
2. Import the repository into **Vercel**.
3. Set the required Environment Variables (`DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`).
4. Vercel automatically builds the React SPA and serves the FastAPI ASGI backend via Serverless Python functions (`api/index.py` & `vercel.json`).

---

## 🛡️ Security & Reliability Best Practices

- **Argon2id Password Hashing**: Utilizes memory-hard password hashing recommended by OWASP.
- **Cryptographic Token Rotation**: Refresh tokens are stored in the database with instant revocation capabilities upon logout.
- **Strict User Isolation**: Every database query verifies `user_id` ownership at the ORM layer to prevent IDOR vulnerabilities.
- **Decimal Monetary Precision**: Eliminates floating-point arithmetic errors in currency balances.
- **Security Headers**: Standardized CSP, Strict-Transport-Security, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff` enabled in production.

---

## 🤝 Contributing

Contributions are warmly welcome! To contribute:
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/Ishitadas03">Ishita Das</a> & the FinSage Community.
</div>
