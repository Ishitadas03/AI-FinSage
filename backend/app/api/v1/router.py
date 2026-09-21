from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, accounts

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(accounts.router)
