"""Tests for LLMLingua-2 compression endpoint."""

from unittest.mock import patch, MagicMock


def test_compress_endpoint_requires_auth(client):
    """Test that compression endpoint requires authentication."""
    response = client.post(
        "/api/v1/compress",
        json={
            "prompt": "This is a test prompt that needs to be compressed.",
            "rate": 0.5,
        },
    )
    assert response.status_code == 403


def test_compress_endpoint_with_valid_auth(client, auth_headers):
    """Test compression endpoint with valid authentication and mocked compression."""
    # Mock LLMLingua compression to avoid model loading issues in CI
    mock_compressor = MagicMock()
    mock_compressor.compress_prompt.return_value = {
        "compressed_prompt": "This test prompt compressed efficiency."
    }

    with patch(
        "app.routers.compression_router.LLMLinguaModel.get_instance",
        return_value=mock_compressor,
    ):
        response = client.post(
            "/api/v1/compress",
            json={
                "prompt": "This is a test prompt that needs to be compressed for efficiency.",
                "rate": 0.5,
                "force_tokens": ["test", "efficiency"],
            },
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert "compressed_prompt" in data
    assert "original_length" in data
    assert "compressed_length" in data
    assert "compression_ratio" in data
    assert "savings_tokens" in data


def test_compress_endpoint_validates_rate(client, auth_headers):
    """Test that compression rate must be between 0.1 and 0.9."""
    # Test rate too low
    response = client.post(
        "/api/v1/compress",
        json={"prompt": "Test prompt", "rate": 0.05},
        headers=auth_headers,
    )
    assert response.status_code == 422  # Validation error

    # Test rate too high
    response = client.post(
        "/api/v1/compress",
        json={"prompt": "Test prompt", "rate": 0.95},
        headers=auth_headers,
    )
    assert response.status_code == 422  # Validation error


def test_compress_endpoint_validates_prompt_length(client, auth_headers):
    """Test that prompt must be within length limits."""
    # Empty prompt
    response = client.post(
        "/api/v1/compress", json={"prompt": "", "rate": 0.5}, headers=auth_headers
    )
    assert response.status_code == 422  # Validation error

    # Prompt too long (over 50000 characters)
    response = client.post(
        "/api/v1/compress",
        json={"prompt": "a" * 50001, "rate": 0.5},
        headers=auth_headers,
    )
    assert response.status_code == 422  # Validation error
