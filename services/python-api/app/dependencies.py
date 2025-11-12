"""Security dependencies for Zero Trust authentication."""

import secrets
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

# Security scheme for Bearer token
security = HTTPBearer()


async def verify_shared_secret(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> None:
    """
    Verify the shared secret using timing-attack-resistant comparison.

    Args:
        credentials: Bearer token from Authorization header

    Raises:
        HTTPException: 403 Forbidden if secret is invalid

    Usage:
        @app.post("/protected", dependencies=[Depends(verify_shared_secret)])
        async def protected_endpoint():
            return {"status": "authorized"}
    """
    provided_secret = credentials.credentials

    # Use secrets.compare_digest for timing-attack resistance
    if not secrets.compare_digest(provided_secret, settings.shared_secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
