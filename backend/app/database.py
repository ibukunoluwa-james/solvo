"""
Solvo Backend — Async Database Engine & Session

Creates a single async SQLAlchemy engine and provides a dependency-injectable
session factory for FastAPI route handlers.
"""

#This is where I establish the connection to the DBMS

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ── Engine ──
# pool_pre_ping keeps connections healthy across idle periods
engine = create_async_engine(
    settings.database_url,
    echo=(settings.app_env == "development"),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# ── Session Factory ──
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base Model ──
class Base(DeclarativeBase):
    """All ORM models inherit from this."""
    pass


# ── Dependency ──
async def get_db() -> AsyncSession:
    """
    FastAPI dependency that yields an async session.
    Automatically commits on success, rolls back on exception.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
