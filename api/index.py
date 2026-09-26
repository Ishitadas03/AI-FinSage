"""
Vercel Serverless Function entrypoint for FinSage FastAPI application.
Exposes the ASGI app instance for Vercel Python runtime discovery.
"""
import sys
from pathlib import Path

# Ensure backend directory is on sys.path for Vercel Serverless execution
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app

__all__ = ["app"]
