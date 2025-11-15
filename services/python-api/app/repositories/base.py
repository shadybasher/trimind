"""Base repository with generic CRUD operations.

This module provides a generic repository pattern for all database models.
Supports async operations with type safety.
"""

from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.sql import Select

# Generic type for SQLModel models
T = TypeVar("T")


class BaseRepository(Generic[T]):
    """
    Generic repository providing CRUD operations for any SQLModel.

    Type Parameters:
        T: The SQLModel type this repository operates on

    Example:
        class UserRepository(BaseRepository[User]):
            async def get_by_email(self, email: str) -> Optional[User]:
                result = await self.session.execute(
                    select(User).where(User.email == email)
                )
                return result.scalar_one_or_none()
    """

    def __init__(self, model: Type[T], session: AsyncSession):
        """
        Initialize repository.

        Args:
            model: The SQLModel class this repository manages
            session: Async database session
        """
        self.model = model
        self.session = session

    async def create(self, obj: T) -> T:
        """
        Create a new record.

        Args:
            obj: Model instance to create

        Returns:
            Created model instance with generated ID
        """
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def get(self, id: str) -> Optional[T]:
        """
        Get record by ID.

        Args:
            id: Primary key value

        Returns:
            Model instance or None if not found
        """
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def list(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        List records with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of model instances
        """
        result = await self.session.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def update(self, obj: T) -> T:
        """
        Update existing record.

        Args:
            obj: Model instance with updated values

        Returns:
            Updated model instance
        """
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: str) -> bool:
        """
        Delete record by ID.

        Args:
            id: Primary key value

        Returns:
            True if deleted, False if not found
        """
        obj = await self.get(id)
        if obj:
            await self.session.delete(obj)
            await self.session.commit()
            return True
        return False

    async def count(self) -> int:
        """
        Count total records.

        Returns:
            Total number of records
        """
        result = await self.session.execute(select(self.model))
        return len(list(result.scalars().all()))

    async def exists(self, id: str) -> bool:
        """
        Check if record exists.

        Args:
            id: Primary key value

        Returns:
            True if exists, False otherwise
        """
        obj = await self.get(id)
        return obj is not None
