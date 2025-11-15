"""Database connection and session management for SQLModel.

This module provides:
- Async database engine with connection pooling
- Session factory for FastAPI dependencies
- Table creation utilities
"""

from typing import AsyncGenerator
import os
from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool
import logging

logger = logging.getLogger(__name__)

# ========================================
# Database Configuration
# ========================================

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Convert postgresql:// to postgresql+asyncpg:// for async support
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DATABASE_URL.startswith("postgres://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://")
else:
    ASYNC_DATABASE_URL = DATABASE_URL

logger.info(f"Database URL configured (async): {ASYNC_DATABASE_URL.split('@')[0]}@***")

# ========================================
# Async Engine with Connection Pooling
# ========================================

# Create async engine with optimized connection pooling
async_engine: AsyncEngine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",  # SQL logging in debug mode
    future=True,
    pool_size=10,  # Max connections in pool
    max_overflow=20,  # Max connections beyond pool_size
    pool_pre_ping=True,  # Verify connection health before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "server_settings": {
            "application_name": "trimind-python-api",
        }
    },
)

logger.info("Async database engine initialized with connection pooling")


# ========================================
# Session Factory (FastAPI Dependency)
# ========================================

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to provide database sessions.

    Usage in route:
        @router.get("/example")
        async def example(session: AsyncSession = Depends(get_session)):
            result = await session.execute(select(User))
            return result.scalars().all()

    Yields:
        AsyncSession: Database session with automatic commit/rollback
    """
    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ========================================
# Database Initialization
# ========================================

async def init_db() -> None:
    """
    Initialize database tables.

    Creates all tables defined in SQLModel metadata.
    Safe to call multiple times (idempotent).

    Note: This is for development/testing. In production, use Alembic migrations.
    """
    from app.db_models import User, Session, Message  # noqa: F401

    logger.info("Creating database tables...")

    async with async_engine.begin() as conn:
        # Create all tables (idempotent - won't recreate existing tables)
        await conn.run_sync(SQLModel.metadata.create_all)

    logger.info("Database tables created successfully")


async def close_db() -> None:
    """
    Close database connections.

    Call this during application shutdown to cleanly close all connections.
    """
    logger.info("Closing database connections...")
    await async_engine.dispose()
    logger.info("Database connections closed")


# ========================================
# Connection Pool Monitoring (Optional)
# ========================================

def get_pool_status() -> dict:
    """
    Get current connection pool status for monitoring.

    Returns:
        dict: Pool statistics including size, overflow, and checked out connections
    """
    pool = async_engine.pool
    return {
        "pool_size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow(),
    }
