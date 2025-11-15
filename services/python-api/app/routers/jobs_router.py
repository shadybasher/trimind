"""Jobs Router for processing AI tasks from BullMQ Proxy - SQLModel Edition."""

from fastapi import APIRouter, BackgroundTasks, Depends
from typing import Dict, Any
from pydantic import BaseModel, Field
from app.dependencies import verify_shared_secret
from app.routers.intent_router import classify_with_primary
from app.models import LLMLinguaModel
from app.database import async_engine
from app.repositories.message import MessageRepository
from app.services.llm_router import LLMRouter
from sqlmodel.ext.asyncio.session import AsyncSession
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class AIJobRequest(BaseModel):
    """Request model for AI job processing from BullMQ Proxy."""

    sessionId: str = Field(..., description="Session ID")
    userId: str = Field(..., description="User ID")
    messageId: str = Field(..., description="Message ID")
    message: str = Field(
        ..., min_length=1, max_length=10000, description="User message"
    )
    timestamp: str = Field(..., description="Message timestamp (ISO format)")


class AIJobResponse(BaseModel):
    """Response model for AI job webhook."""

    status: str = Field(default="processing", description="Job status")
    messageId: str = Field(..., description="Message ID being processed")
    jobId: str = Field(..., description="Internal job tracking ID")


async def process_ai_job_background(job_data: AIJobRequest):
    """
    Background task to process AI job - SQLModel Edition.

    This function runs asynchronously after the webhook returns 200 OK.

    Flow:
    1. Run intent classification (NLU)
    2. Compress prompt if needed (optional)
    3. Route to appropriate LLM provider
    4. Save AI response to database (SQLModel + AsyncSession)

    Args:
        job_data: AI job data from BullMQ

    Note:
        This is the CRITICAL function that was failing with Prisma SIGSEGV.
        Now uses SQLModel with async support - NO BINARY DEPENDENCIES.
    """
    logger.info(f"[Background Task] Processing AI job for message {job_data.messageId}")

    try:
        # Step 1: Intent Classification
        intent_result = await classify_with_primary(job_data.message)
        logger.info(
            f"  Intent: {intent_result['intent']}, Target Model: {intent_result['target_model']}"
        )

        # Step 2: Prompt Compression (if message > 500 chars) - OPTIONAL
        prompt = job_data.message
        if len(prompt) > 500:
            try:
                compressor = LLMLinguaModel.get_instance()
                compressed_result = compressor.compress_prompt(
                    [prompt], rate=0.5, force_tokens=[]
                )
                prompt = compressed_result["compressed_prompt"]
                logger.info(
                    f"  Compressed: {len(job_data.message)} -> {len(prompt)} chars"
                )
            except Exception as e:
                logger.warning(f"  Compression failed (using original): {str(e)}")

        # Step 3: LLM Routing & Execution - NEW MULTI-PROVIDER ROUTER
        llm_router = LLMRouter()

        # Determine provider from intent or use default (Google Gemini)
        provider = llm_router.select_provider(intent=intent_result.get("intent"))

        llm_response: Dict[str, Any] = await llm_router.route(
            provider=provider.value,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )

        ai_message = llm_response["content"]
        logger.info(
            f"  AI Response from {llm_response['provider']}/{llm_response['model']}: {ai_message[:50]}..."
        )

        # Step 4: Save to Database - SQLModel + AsyncSession (NO MORE PRISMA!)
        async with AsyncSession(async_engine, expire_on_commit=False) as session:
            message_repo = MessageRepository(session)

            # Create AI message with auto-generated CUID
            ai_message_record = await message_repo.create_with_provider(
                session_id=job_data.sessionId,
                user_id=job_data.userId,
                role="assistant",
                content=ai_message,
                provider=llm_response["provider"],
                model=llm_response["model"],
            )

            logger.info(
                f"  ✓ Saved to database: AI message {ai_message_record.id} (for user message {job_data.messageId})"
            )
            logger.info(
                f"  ✓ Provider: {ai_message_record.provider}, Model: {ai_message_record.model}"
            )

    except Exception as e:
        logger.error(f"  ✗ Error processing job: {str(e)}", exc_info=True)


@router.post(
    "/jobs/process-ai-job",
    response_model=AIJobResponse,
    dependencies=[Depends(verify_shared_secret)],
    summary="Process AI job from BullMQ Proxy",
    description="Webhook endpoint that receives AI processing jobs from BullMQ Proxy worker",
)
async def process_ai_job_webhook(
    job_data: AIJobRequest, background_tasks: BackgroundTasks
) -> AIJobResponse:
    """
    Webhook endpoint for processing AI jobs from BullMQ Proxy.

    **Architecture Pattern:**
    - Returns `200 OK` immediately (non-blocking)
    - Adds actual processing to background tasks
    - BullMQ Proxy receives success response instantly

    **Background Processing:**
    1. Intent Classification (NLU)
    2. Prompt Compression (LLMLingua-2)
    3. LLM Routing & Execution
    4. Database Write (save AI response)

    **Security:**
    - Requires shared secret authentication
    - Only BullMQ Proxy service can call this endpoint

    **Example Request:**
    ```json
    {
      "sessionId": "clxxx",
      "userId": "clyyy",
      "messageId": "clzzz",
      "message": "Hello, how are you?",
      "timestamp": "2025-01-01T12:00:00Z"
    }
    ```

    **Response (immediate 200 OK):**
    ```json
    {
      "status": "processing",
      "messageId": "clzzz",
      "jobId": "job-clzzz-123456"
    }
    ```
    """
    # Generate unique job ID for tracking
    job_id = f"job-{job_data.messageId}-{hash(job_data.timestamp)}"

    print(
        f"[Python Worker] Webhook received for Job {job_id} (message {job_data.messageId})"
    )

    # Add AI processing to background tasks (runs after response sent)
    background_tasks.add_task(process_ai_job_background, job_data)

    # Return 200 OK immediately (non-blocking)
    return AIJobResponse(
        status="processing", messageId=job_data.messageId, jobId=job_id
    )
