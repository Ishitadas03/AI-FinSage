from logging.config import fileConfig
import sys
from pathlib import Path
from sqlalchemy import create_engine, pool
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
    target_url = settings.DATABASE_URL
    connectable = None

    try:
        connect_args = {"connect_timeout": 2} if target_url.startswith("postgresql") else {}
        connectable = create_engine(
            target_url,
            poolclass=pool.NullPool,
            connect_args=connect_args,
        )
        with connectable.connect() as conn:
            pass
    except Exception as err:
        if settings.ENVIRONMENT == "development" and target_url.startswith("postgresql"):
            _BACKEND_DIR = Path(__file__).resolve().parent.parent
            _ROOT_DIR = _BACKEND_DIR.parent
            _SQLITE_PATH = (_ROOT_DIR / "finsage_dev.db").resolve()
            sqlite_url = f"sqlite:///{_SQLITE_PATH.as_posix()}"
            print(f"[ALEMBIC] PostgreSQL unreachable ({err}). Targeting local SQLite ({sqlite_url})...")
            connectable = create_engine(
                sqlite_url,
                poolclass=pool.NullPool,
            )
        else:
            raise err

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True if "sqlite" in str(connectable.url) else False,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
