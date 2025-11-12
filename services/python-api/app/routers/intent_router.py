"""Intent Router with Circuit Breaker pattern for resilient LLM intent classification."""

from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from circuitbreaker import circuit
import litellm
from app.config import settings
from app.dependencies import verify_shared_secret

router = APIRouter()


class IntentRequest(BaseModel):
    """Request model for intent classification."""

    text: str = Field(
        ..., min_length=1, max_length=10000, description="Text to classify"
    )


class IntentResponse(BaseModel):
    """Response model for intent classification."""

    intent: str = Field(..., description="Classified intent category")
    source_model: Literal["gpt-4o-mini", "claude-3-haiku-20240307"] = Field(
        ..., description="Model used for classification"
    )
    target_model: str = Field(..., description="Recommended model for processing")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1)")


@circuit(
    failure_threshold=settings.circuit_breaker_failure_threshold,
    recovery_timeout=settings.circuit_breaker_timeout,
    expected_exception=Exception,
)
async def classify_with_primary(text: str) -> dict:
    """
    Classify intent using primary model (gpt-4o-mini) with circuit breaker protection.

    Args:
        text: Input text to classify

    Returns:
        dict: Classification result with intent, confidence, and model info

    Raises:
        Exception: If primary model fails (circuit breaker will catch this)
    """
    response = await litellm.acompletion(
        model=settings.intent_router_primary_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an intent classifier. Analyze the user's message and classify it into ONE of these intents: "
                    "greeting, question, command, feedback, help, other. "
                    "Respond with ONLY a JSON object in this exact format: "
                    '{{"intent": "category", "confidence": 0.95, "target_model": "gpt-4o"}}'
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0.0,
        max_tokens=100,
    )

    # Extract and parse response
    content = response.choices[0].message.content
    import json

    result = json.loads(content)
    result["source_model"] = settings.intent_router_primary_model
    return result


async def classify_with_fallback(text: str) -> dict:
    """
    Classify intent using fallback model (claude-3-haiku).

    Args:
        text: Input text to classify

    Returns:
        dict: Classification result with intent, confidence, and model info

    Raises:
        Exception: If fallback model also fails
    """
    response = await litellm.acompletion(
        model=settings.intent_router_fallback_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an intent classifier. Analyze the user's message and classify it into ONE of these intents: "
                    "greeting, question, command, feedback, help, other. "
                    "Respond with ONLY a JSON object in this exact format: "
                    '{{"intent": "category", "confidence": 0.95, "target_model": "claude-3-5-sonnet"}}'
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0.0,
        max_tokens=100,
    )

    # Extract and parse response
    content = response.choices[0].message.content
    import json

    result = json.loads(content)
    result["source_model"] = settings.intent_router_fallback_model
    return result


@router.post(
    "/intent-router-resilient",
    response_model=IntentResponse,
    dependencies=[Depends(verify_shared_secret)],
    summary="Classify intent with resilient failover",
    description="Classifies user intent using primary model (gpt-4o-mini) with automatic fallback to Claude Haiku if primary fails",
)
async def classify_intent_resilient(request: IntentRequest) -> IntentResponse:
    """
    Classify user intent with circuit breaker protection and automatic fallback.

    **Architecture:**
    - **Primary (P1):** gpt-4o-mini (OpenAI)
    - **Fallback (S1):** claude-3-haiku (Anthropic)
    - **Circuit Breaker:** 5 failure threshold, 60s recovery timeout

    **Flow:**
    1. Try primary model (gpt-4o-mini)
    2. If circuit breaker open → fallback to Claude Haiku
    3. If both fail → return 503 Service Unavailable

    **Response:**
    ```json
    {
      "intent": "question",
      "source_model": "gpt-4o-mini",
      "target_model": "gpt-4o",
      "confidence": 0.95
    }
    ```
    """
    try:
        # Try primary model with circuit breaker protection
        result = await classify_with_primary(request.text)
        return IntentResponse(**result)
    except Exception as primary_error:
        # Circuit breaker open or primary failed - try fallback
        try:
            result = await classify_with_fallback(request.text)
            return IntentResponse(**result)
        except Exception as fallback_error:
            # Both models failed
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "All intent classification models unavailable",
                    "primary_error": str(primary_error),
                    "fallback_error": str(fallback_error),
                },
            )
