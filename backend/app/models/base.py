from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    SQLAlchemy 2.0 DeclarativeBase providing base model capabilities
    and centralized metadata for Alembic migrations.
    """
    pass
