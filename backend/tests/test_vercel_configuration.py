import json
import os
from pathlib import Path
import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool, QueuePool

from api.index import app as vercel_app
from app.core.database import get_engine_kwargs, is_serverless_environment
from app.main import app as main_app


def test_vercel_entrypoint_exports_fastapi_app():
    """Verify that backend/api/index.py exports the identical FastAPI application instance."""
    assert vercel_app is main_app
    assert isinstance(vercel_app, FastAPI)
    assert vercel_app.title == "FinSage API"


def test_vercel_json_structure_and_rewrites():
    """Verify that backend/vercel.json is valid JSON and configures the exact /(.*) rewrite."""
    vercel_json_path = Path(__file__).resolve().parent.parent / "vercel.json"
    assert vercel_json_path.exists(), "backend/vercel.json must exist"

    with open(vercel_json_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    assert config.get("version") == 2
    assert "rewrites" in config
    assert isinstance(config["rewrites"], list)

    rewrite = config["rewrites"][0]
    assert rewrite.get("source") == "/(.*)"
    assert rewrite.get("destination") == "/api/index.py"


def test_serverless_pool_actual_engine_instantiation_serverless():
    """
    Verify that with is_serverless=True,
    SQLAlchemy creates an engine configured with NullPool and no pool sizing.
    """
    mock_postgres_url = "postgresql+psycopg://neondb_owner:dummy@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb"
    kwargs = get_engine_kwargs(database_url=mock_postgres_url, is_serverless=True)

    assert kwargs["poolclass"] is NullPool
    assert "pool_size" not in kwargs
    assert "max_overflow" not in kwargs
    assert "pool_recycle" not in kwargs
    assert kwargs["connect_args"] == {"connect_timeout": 10}

    test_engine = create_engine(mock_postgres_url, **kwargs)
    assert isinstance(test_engine.pool, NullPool)


def test_serverless_pool_actual_engine_instantiation_persistent():
    """
    Verify that with is_serverless=False (Render / Docker / Local),
    SQLAlchemy creates an engine configured with QueuePool and connection recycling.
    """
    mock_postgres_url = "postgresql+psycopg://neondb_owner:dummy@ep-xyz.us-east-2.aws.neon.tech/neondb"
    kwargs = get_engine_kwargs(database_url=mock_postgres_url, is_serverless=False)

    assert "poolclass" not in kwargs
    assert kwargs["pool_size"] == 10
    assert kwargs["max_overflow"] == 20
    assert kwargs["pool_recycle"] == 1800
    assert kwargs["connect_args"] == {"connect_timeout": 10}

    test_engine = create_engine(mock_postgres_url, **kwargs)
    assert isinstance(test_engine.pool, QueuePool)


def test_vercel_env_var_detection(monkeypatch):
    """
    Genuinely test the application's actual is_serverless_environment() and get_engine_kwargs()
    under isolated environment variable states.
    """
    mock_url = "postgresql+psycopg://neondb_owner:dummy@ep-xyz-pooler.neon.tech/neondb"

    # 1. Clear all serverless indicators to test persistent/local mode
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("SERVERLESS", raising=False)
    monkeypatch.delenv("AWS_LAMBDA_FUNCTION_NAME", raising=False)

    assert is_serverless_environment() is False
    kwargs_local = get_engine_kwargs(database_url=mock_url)
    assert "poolclass" not in kwargs_local
    assert kwargs_local["pool_size"] == 10
    assert kwargs_local["max_overflow"] == 20
    assert kwargs_local["pool_recycle"] == 1800

    # 2. Test VERCEL=1 runtime detection
    monkeypatch.setenv("VERCEL", "1")
    assert is_serverless_environment() is True
    kwargs_vercel = get_engine_kwargs(database_url=mock_url)
    assert kwargs_vercel["poolclass"] is NullPool
    assert "pool_size" not in kwargs_vercel

    # 3. Test generic SERVERLESS=1 runtime detection
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.setenv("SERVERLESS", "1")
    assert is_serverless_environment() is True
    kwargs_serverless = get_engine_kwargs(database_url=mock_url)
    assert kwargs_serverless["poolclass"] is NullPool

    # 4. Test AWS_LAMBDA_FUNCTION_NAME runtime detection
    monkeypatch.delenv("SERVERLESS", raising=False)
    monkeypatch.setenv("AWS_LAMBDA_FUNCTION_NAME", "finsage-handler")
    assert is_serverless_environment() is True
    kwargs_lambda = get_engine_kwargs(database_url=mock_url)
    assert kwargs_lambda["poolclass"] is NullPool
