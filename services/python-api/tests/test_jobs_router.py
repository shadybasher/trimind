"""Tests for jobs router (BullMQ webhook consumer)."""


def test_process_ai_job_requires_auth(client):
    """Test that job processing endpoint requires authentication."""
    response = client.post(
        "/api/v1/jobs/process-ai-job",
        json={
            "sessionId": "test-session",
            "userId": "test-user",
            "messageId": "test-message",
            "message": "Hello",
            "timestamp": "2025-01-01T00:00:00Z",
        },
    )
    assert response.status_code == 403


def test_process_ai_job_returns_200_immediately(client, auth_headers):
    """Test that job webhook returns 200 OK immediately (non-blocking)."""
    response = client.post(
        "/api/v1/jobs/process-ai-job",
        json={
            "sessionId": "clxxx123",
            "userId": "clyyy456",
            "messageId": "clzzz789",
            "message": "Test message for AI processing",
            "timestamp": "2025-01-01T12:00:00Z",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Verify immediate response structure
    assert data["status"] == "processing"
    assert data["messageId"] == "clzzz789"
    assert "jobId" in data


def test_process_ai_job_validates_required_fields(client, auth_headers):
    """Test that job endpoint validates all required fields."""
    # Missing sessionId
    response = client.post(
        "/api/v1/jobs/process-ai-job",
        json={
            "userId": "clyyy456",
            "messageId": "clzzz789",
            "message": "Test",
            "timestamp": "2025-01-01T12:00:00Z",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422

    # Missing message
    response = client.post(
        "/api/v1/jobs/process-ai-job",
        json={
            "sessionId": "clxxx123",
            "userId": "clyyy456",
            "messageId": "clzzz789",
            "timestamp": "2025-01-01T12:00:00Z",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_process_ai_job_validates_message_length(client, auth_headers):
    """Test that message must be within length limits."""
    # Empty message
    response = client.post(
        "/api/v1/jobs/process-ai-job",
        json={
            "sessionId": "clxxx123",
            "userId": "clyyy456",
            "messageId": "clzzz789",
            "message": "",
            "timestamp": "2025-01-01T12:00:00Z",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422

    # Message too long (over 10000 characters)
    response = client.post(
        "/api/v1/jobs/process-ai-job",
        json={
            "sessionId": "clxxx123",
            "userId": "clyyy456",
            "messageId": "clzzz789",
            "message": "a" * 10001,
            "timestamp": "2025-01-01T12:00:00Z",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
