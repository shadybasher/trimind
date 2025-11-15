"""SQLModel database models for Trimind V-Next.

This module defines the database schema using SQLModel (SQLAlchemy + Pydantic).
Replaces Prisma with pure Python implementation for better compatibility.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
import uuid


def generate_cuid() -> str:
    """Generate CUID-compatible ID (using UUID v7 for sortability)."""
    return f"cl{uuid.uuid4().hex[:24]}"


class ProviderEnum(str, Enum):
    """LLM provider enum."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"


class RoleEnum(str, Enum):
    """Message role enum."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ========================================
# User Model
# ========================================
class User(SQLModel, table=True):
    """User model - synced from Clerk via webhook."""

    __tablename__ = "users"

    id: str = Field(default_factory=generate_cuid, primary_key=True)
    clerkId: str = Field(unique=True, index=True, description="Clerk user ID")
    email: str = Field(unique=True, index=True)
    firstName: Optional[str] = Field(default=None)
    lastName: Optional[str] = Field(default=None)
    imageUrl: Optional[str] = Field(default=None)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    sessions: List["Session"] = Relationship(back_populates="user")
    messages: List["Message"] = Relationship(back_populates="user")


# ========================================
# Session Model
# ========================================
class Session(SQLModel, table=True):
    """Session model - conversation sessions."""

    __tablename__ = "sessions"

    id: str = Field(default_factory=generate_cuid, primary_key=True)
    userId: str = Field(foreign_key="users.id", index=True)
    title: str = Field(default="New Conversation")
    createdAt: datetime = Field(default_factory=datetime.utcnow, index=True)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="sessions")
    messages: List["Message"] = Relationship(back_populates="session")


# ========================================
# Message Model
# ========================================
class Message(SQLModel, table=True):
    """Message model - individual messages in sessions."""

    __tablename__ = "messages"

    id: str = Field(default_factory=generate_cuid, primary_key=True)
    sessionId: str = Field(foreign_key="sessions.id", index=True)
    userId: str = Field(foreign_key="users.id", index=True)
    role: str = Field(description="Message role (user/assistant/system)")
    content: str = Field(description="Message content")

    # LLM Metadata (for assistant messages)
    provider: Optional[str] = Field(
        default=None, description="LLM provider (openai/anthropic/google)"
    )
    model: Optional[str] = Field(
        default=None,
        description="Model used (gpt-4o/claude-3-7-sonnet/gemini-2.0-flash)",
    )

    createdAt: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationships
    session: Session = Relationship(back_populates="messages")
    user: User = Relationship(back_populates="messages")


# ========================================
# Pydantic Models for API (Request/Response)
# ========================================
class MessageCreate(SQLModel):
    """Request model for creating a message."""

    sessionId: str
    userId: str
    role: RoleEnum
    content: str
    provider: Optional[ProviderEnum] = None
    model: Optional[str] = None


class MessageRead(SQLModel):
    """Response model for reading a message."""

    id: str
    sessionId: str
    userId: str
    role: str
    content: str
    provider: Optional[str]
    model: Optional[str]
    createdAt: datetime


class SessionCreate(SQLModel):
    """Request model for creating a session."""

    userId: str
    title: str = "New Conversation"


class SessionRead(SQLModel):
    """Response model for reading a session."""

    id: str
    userId: str
    title: str
    createdAt: datetime
    updatedAt: datetime
