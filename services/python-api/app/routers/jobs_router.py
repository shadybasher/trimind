"""Jobs Router for processing AI tasks from BullMQ Proxy."""

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from app.dependencies import verify_shared_secret

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
    Background task to process AI job.

    This function runs asynchronously after the webhook returns 200 OK.

    Flow:
    1. Run intent classification (NLU)
    2. Compress prompt if needed
    3. Route to appropriate LLM
    4. Save AI response to database

    Args:
        job_data: AI job data from BullMQ
    """
    # TODO: Implement full AI processing pipeline
    # For now, just log the job
    print(f"[Background Task] Processing AI job for message {job_data.messageId}")
    print(f"  Session: {job_data.sessionId}")
    print(f"  User: {job_data.userId}")
    print(f"  Message: {job_data.message[:50]}...")

    # Placeholder for actual implementation:
    # 1. intent = await classify_intent(job_data.message)
    # 2. compressed = compress_prompt(job_data.message) if needed
    # 3. response = await call_llm(compressed, intent.target_model)
    # 4. save_to_database(job_data.sessionId, response)


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

    # Add AI processing to background tasks (runs after response sent)
    background_tasks.add_task(process_ai_job_background, job_data)

    # Return 200 OK immediately (non-blocking)
    return AIJobResponse(
        status="processing", messageId=job_data.messageId, jobId=job_id
    )
