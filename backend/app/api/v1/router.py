from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    accounts,
    transactions,
    analytics,
    financial_health,
    loans,
    emi,
    debt_stress,
    goals,
    budgets,
    bank_statement_import,
)

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(accounts.router)
api_v1_router.include_router(transactions.router)
api_v1_router.include_router(loans.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(financial_health.router)
api_v1_router.include_router(emi.router)
api_v1_router.include_router(debt_stress.router)
api_v1_router.include_router(goals.router)
api_v1_router.include_router(budgets.router)
api_v1_router.include_router(bank_statement_import.router)


