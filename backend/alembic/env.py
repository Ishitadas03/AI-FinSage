from logging.config import fileConfig
import sys
from pathlib import Path
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import make_url
from alembic import context

# Ensure backend root directory is on Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.models.base import Base
# Import all models here so Alembic can detect full schema
import app.models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    raw_url = str(settings.DATABASE_URL)
    try:
        url_obj = make_url(raw_url)
        print(f"[Alembic] Connecting to database: {url_obj.render_as_string(hide_password=True)}")
        connectable = create_engine(
            url_obj,
            poolclass=pool.NullPool,
        )
    except Exception as exc:
        print(f"[Alembic ERROR] Failed parsing database URL: {exc}. URL length: {len(raw_url)}, starts with: {raw_url[:15]!r}")
        raise

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
