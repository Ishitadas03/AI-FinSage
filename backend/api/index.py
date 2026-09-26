"""
Vercel Serverless Function entrypoint for FinSage FastAPI application.
Exposes the ASGI app instance for Vercel Python runtime discovery.
"""
import sys
from pathlib import Path

# Ensure backend root directory is on sys.path for Vercel Serverless execution
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app

# Vercel discovers and invokes the ASGI/WSGI 'app' callable
__all__ = ["app"]

