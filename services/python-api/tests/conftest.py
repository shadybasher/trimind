"""Pytest configuration and fixtures for Python API tests."""

import os
import pytest
from fastapi.testclient import TestClient


# Set test environment variables BEFORE importing app
# This ensures Settings loads test values instead of empty strings
os.environ["SHARED_SECRET"] = "test-secret-for-testing-only"
os.environ["OPENAI_API_KEY"] = "test-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "test-anthropic-key"

# Now import app after env vars are set
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    """Test client fixture for FastAPI application."""
    return TestClient(app)


# VCR.py Configuration
@pytest.fixture(scope="module")
def vcr_config():
    """
    VCR.py configuration with security best practices.

    Features:
    - Authorization header filtering (prevents secret leakage)
    - record_mode='none' by default (safe for CI)
    - Cassettes stored in tests/cassettes/
    """
    return {
        "filter_headers": [
            ("authorization", "REDACTED"),
            ("x-api-key", "REDACTED"),
        ],
        "record_mode": "none",  # Safe default: never record, only replay
        "cassette_library_dir": "tests/cassettes",
        "path_transformer": lambda path: path,  # Keep original cassette names
        "match_on": ["method", "scheme", "host", "port", "path", "query"],
    }


@pytest.fixture
def auth_headers():
    """
    Mock authorization headers for testing protected endpoints.

    Returns:
        dict: Headers with Bearer token
    """
    return {"Authorization": "Bearer test-secret-for-testing-only"}
