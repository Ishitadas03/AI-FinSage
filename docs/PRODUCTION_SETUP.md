# FinSage Production Setup & Deployment Runbook

This runbook details the architecture, required external services, environment configuration, database migrations, smoke test procedures, and rollback protocol for deploying FinSage to Production.

---

## 1. Production Architecture Overview

```
[ User Browser ]
       │
       ▼
[ Vercel CDN / Edge ]
   ├── Static Frontend SPA (Vite + React 18 + TailwindCSS)
   │     └── Initialized with Clerk React SDK (pk_live_...)
   │
   └── Serverless Python Function (/api/index.py -> FastAPI ASGI)
         ├── Auth Dependency (deps.py)
         │     └── Fetches Clerk JWKS from https://clerk.yourdomain.com/.well-known/jwks.json
         │     └── Verifies RS256 JWT signatures
         │     └── Resolves / creates user in PostgreSQL (users.clerk_user_id)
         │
         └── SQLAlchemy Engine (database.py)
               └── Serverless NullPool connection to Cloud PostgreSQL (Neon / Supabase)
```

---

## 2. Required Production Environment Variables

### A. Vercel Project Settings $\rightarrow$ Environment Variables (Production Scope)

| Variable | Scope | Required? | Example Format / Value | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | **Yes** | `postgresql+psycopg://user:pass@host:5432/dbname?sslmode=require` | Must use cloud PostgreSQL with SSL. Never `localhost`. |
| `CLERK_ISSUER_URL` | Backend | **Yes** | `https://clerk.yourdomain.com` or `https://<prod-instance>.clerk.accounts.dev` | Frontend API URL used for JWKS token verification. |
| `CLERK_SECRET_KEY` | Backend | **Yes** | `sk_live_...` | Production secret key from Clerk Dashboard. |
| `CLERK_PUBLISHABLE_KEY` | Backend | **Yes** | `pk_live_...` | Production publishable key. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | **Yes** | `pk_live_...` | Injected into frontend bundle at build time. |
| `JWT_SECRET_KEY` | Backend | **Yes** | `64-character random hex string` | Must be $\ge 32$ chars. Generatable via `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `ENVIRONMENT` | Backend | **Yes** | `production` | Enforces strict validation and disables dev fallbacks. |
| `DEBUG` | Backend | **Yes** | `False` | Disables stack traces in HTTP responses. |
| `CORS_ORIGINS` | Backend | **Yes** | `https://ai-finsage.vercel.app,https://yourdomain.com` | Strict whitelist of production web domains. |
| `VITE_API_BASE_URL` | Frontend | Optional | `/api/v1` | Relative path routes through Vercel serverless rewrites. |
| `CLERK_WEBHOOK_SECRET` | Backend | Optional | `whsec_...` | For Clerk user synchronization webhooks. |
| `CRON_SECRET` | Backend | Optional | `random_token` | Protects automated cleanup endpoints. |
| `GEMINI_API_KEY` | Backend | Optional | `AIza...` | For Grounded AI Copilot and Monthly Report analysis. |

---

## 3. External Service Configuration Guide

### A. Clerk Production Instance Setup
1. In your **Clerk Dashboard**, navigate to your Production Application (or switch environment from Development to Production).
2. Under **API Keys**, retrieve:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`
3. Under **Domains / Custom Domains**:
   - Note your Frontend API / Issuer URL (e.g. `https://clerk.yourdomain.com` or `https://<instance-id>.clerk.accounts.dev`).
4. Under **Paths / Routing**:
   - Ensure Sign-in path is `/signin` and Sign-up path is `/signup`.
   - Ensure Redirect URLs include `https://ai-finsage.vercel.app` (and your custom domain).

### B. Cloud PostgreSQL Database Setup (e.g., Neon / Supabase / AWS RDS)
1. Provision a PostgreSQL instance (v14, v15, or v16).
2. Obtain the connection string in standard URL format:
   `postgresql://username:password@hostname:5432/database_name?sslmode=require`
3. If using connection pooler (e.g. Supabase transaction pooler on port 6543 or Neon pooled endpoint), ensure connection timeouts are set to $\ge 10\text{s}$.

---

## 4. Production Database Migration Runbook

Before directing live user traffic, execute the complete migration sequence against the fresh production database.

Run from your secure local terminal (with environment set to target DB):

```powershell
# Set temporary target database connection string in your shell:
$env:DATABASE_URL="postgresql+psycopg://username:password@cloud-host:5432/dbname?sslmode=require"

# Navigate to backend directory:
cd backend

# Execute all migrations through head (Revision 016):
python -m alembic upgrade head

# Verify migration state:
python -m alembic current
# Expected output: 016_add_user_status_column (head)
```

### Full Migration History Applied:
1. `001_initial_user_model`: `users` base schema
2. `002_add_refresh_sessions`: `refresh_sessions` token tracking
3. `003_add_accounts_table`: `accounts` bank/wallet ledger
4. `004_add_transactions_table`: `transactions` double-entry transactions
5. `005_add_destination_account_to_transactions`: Transfer handling
6. `006_add_credit_limit_to_accounts`: Credit card limits
7. `007_add_loans_table`: `loans` and amortization
8. `008_add_financial_goals_table`: `financial_goals`
9. `009_add_financial_goal_contributions_table`: Goal contribution entries
10. `010_add_financial_budgets_table`: `financial_budgets`
11. `011_add_import_fields_to_transactions`: CSV statement batch imports
12. `012_add_clerk_user_id`: `users.clerk_user_id` and nullable password hash
13. `013_add_recurring_bills_and_notifications`: `recurring_bills` & `notifications`
14. `014_add_chat_messages`: `chat_messages` AI history
15. `015_add_user_profile_and_audit_logs`: User profile metrics & `audit_logs`
16. `016_add_user_status_column`: `users.status` account deletion lifecycle

---

## 5. Vercel Production Deployment Procedure

1. **Set Environment Variables**:
   In Vercel Dashboard $\rightarrow$ Project Settings $\rightarrow$ Environment Variables $\rightarrow$ Select **Production** environment $\rightarrow$ add all variables from Section 2.
2. **Trigger Deployment**:
   - In Vercel Deployments, select **Deploy latest commit (`main` branch)**.
   - Ensure **"Redeploy without Cache"** is checked so Vite rebuilds with the new `VITE_CLERK_PUBLISHABLE_KEY`.
3. **Monitor Build**:
   - Verify `npm run build` exits with code 0.
   - Verify serverless function bundle packaging passes.

---

## 6. Post-Deployment Verification & Smoke Tests

Execute these verification checks immediately after deployment:

### Automated Endpoint Checks
```bash
# 1. API Health:
curl -I https://ai-finsage.vercel.app/api/v1/health
# Expected: HTTP 200 OK

# 2. Database Connectivity:
curl -s https://ai-finsage.vercel.app/api/v1/health/db
# Expected: {"status":"healthy","database":"postgresql","connected":true}

# 3. Unauthenticated Rejection:
curl -I https://ai-finsage.vercel.app/api/v1/auth/me
# Expected: HTTP 401 Unauthorized
```

### End-to-End User Verification
1. Open `https://ai-finsage.vercel.app/signin` in an incognito browser window.
2. Sign in or register via Clerk Production.
3. Verify automatic redirection to `/dashboard`.
4. Open DevTools Network tab:
   - `GET /api/v1/auth/me` $\rightarrow$ `HTTP 200 OK`
   - `GET /api/v1/accounts` $\rightarrow$ `HTTP 200 OK`
   - `GET /api/v1/analytics/overview` $\rightarrow$ `HTTP 200 OK`
5. Test creating a sample transaction $\rightarrow$ verify balance updates in real time.

---

## 7. Emergency Rollback Protocol

If any critical acceptance criteria fail during initial release:

1. **Immediate Rollback Trigger Conditions**:
   - `GET /api/v1/health/db` returns 503 or database timeout.
   - `GET /api/v1/auth/me` returns 401 for valid production Clerk sessions.
   - Serverless functions experience unhandled exceptions or 5xx crash loops.
2. **Rollback Steps**:
   - In Vercel Dashboard $\rightarrow$ **Deployments** $\rightarrow$ locate the previous stable deployment $\rightarrow$ click **Promote to Production** (instant zero-downtime rollback).
   - If database rollback is needed, run:
     ```powershell
     python -m alembic downgrade <target_revision>
     ```

---

## 8. Security & Production Checklist

- [ ] `ENVIRONMENT` is explicitly set to `production`.
- [ ] `DEBUG` is set to `False`.
- [ ] `JWT_SECRET_KEY` is a securely generated random string ($\ge 32$ characters).
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`) and points to cloud host.
- [ ] CORS origins only whitelist verified production domain(s).
- [ ] No `.env` or `.env.local` files committed to version control.
- [ ] `alembic current` confirms head revision `016_add_user_status_column`.
