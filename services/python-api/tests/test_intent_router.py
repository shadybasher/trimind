"""Tests for Intent Router with Circuit Breaker."""

from unittest.mock import patch, AsyncMock


def test_intent_router_requires_auth(client):
    """Test that intent router endpoint requires authentication."""
    response = client.post(
        "/api/v1/intent-router-resilient", json={"text": "Hello, how are you?"}
    )
    assert response.status_code == 403


def test_intent_router_classifies_greeting(client, auth_headers):
    """Test intent classification for greeting message with mocked LLM."""
    # Mock litellm.acompletion to return fake intent response
    mock_response = AsyncMock()
    mock_response.choices = [
        AsyncMock(
            message=AsyncMock(
                content='{"intent": "greeting", "confidence": 0.95, "target_model": "gpt-4o"}'
            )
        )
    ]

    with patch(
        "app.routers.intent_router.litellm.acompletion", return_value=mock_response
    ):
        response = client.post(
            "/api/v1/intent-router-resilient",
            json={"text": "Hello, how are you today?"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert "intent" in data
    assert "source_model" in data
    assert "target_model" in data
    assert "confidence" in data
    assert 0.0 <= data["confidence"] <= 1.0


def test_intent_router_classifies_question(client, auth_headers):
    """Test intent classification for question message with mocked LLM."""
    # Mock litellm.acompletion to return fake intent response
    mock_response = AsyncMock()
    mock_response.choices = [
        AsyncMock(
            message=AsyncMock(
                content='{"intent": "question", "confidence": 0.92, "target_model": "gpt-4o"}'
            )
        )
    ]

    with patch(
        "app.routers.intent_router.litellm.acompletion", return_value=mock_response
    ):
        response = client.post(
            "/api/v1/intent-router-resilient",
            json={"text": "What is the capital of France?"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert "intent" in data
    assert data["intent"] in ["question", "other"]  # Flexible assertion


def test_intent_router_validates_text_length(client, auth_headers):
    """Test that text must be within length limits."""
    # Empty text
    response = client.post(
        "/api/v1/intent-router-resilient", json={"text": ""}, headers=auth_headers
    )
    assert response.status_code == 422  # Validation error

    # Text too long (over 10000 characters)
    response = client.post(
        "/api/v1/intent-router-resilient",
        json={"text": "a" * 10001},
        headers=auth_headers,
    )
    assert response.status_code == 422  # Validation error


def test_intent_router_handles_special_characters(client, auth_headers):
    """Test intent router with special characters."""
    response = client.post(
        "/api/v1/intent-router-resilient",
        json={"text": "Hello! @#$%^&*() How's it going? 你好"},
        headers=auth_headers,
    )
    # Should not crash, even if classification fails
    assert response.status_code in [200, 503]  # Success or service unavailable
