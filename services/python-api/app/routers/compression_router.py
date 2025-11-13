"""LLMLingua-2 Compression Router for aggressive prompt compression."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.models import LLMLinguaModel
from app.dependencies import verify_shared_secret

router = APIRouter()


class CompressionRequest(BaseModel):
    """Request model for prompt compression."""

    prompt: str = Field(
        ..., min_length=1, max_length=50000, description="Prompt to compress"
    )
    rate: float = Field(
        default=0.5,
        ge=0.1,
        le=0.9,
        description="Compression rate (0.1-0.9). Lower = more aggressive compression",
    )
    force_tokens: list[str] = Field(
        default_factory=list,
        description="List of tokens that must be preserved in compressed output",
    )


class CompressionResponse(BaseModel):
    """Response model for prompt compression."""

    compressed_prompt: str = Field(..., description="Compressed prompt text")
    original_length: int = Field(..., description="Original prompt token count")
    compressed_length: int = Field(..., description="Compressed prompt token count")
    compression_ratio: float = Field(
        ..., description="Actual compression ratio achieved"
    )
    savings_tokens: int = Field(..., description="Number of tokens saved")


@router.post(
    "/compress",
    response_model=CompressionResponse,
    dependencies=[Depends(verify_shared_secret)],
    summary="Compress prompt using LLMLingua-2",
    description="Compresses prompts using state-of-the-art LLMLingua-2 transformer model with quality preservation",
)
def compress_prompt(request: CompressionRequest) -> CompressionResponse:
    """
    Compress prompt using LLMLingua-2 with aggressive compression and quality preservation.

    **IMPORTANT:** This endpoint is synchronous (`def`, not `async def`) because model inference
    is CPU-bound. FastAPI will automatically run it in a thread pool.

    **Model:** microsoft/llmlingua-2-xlm-roberta-large-meetingbank

    **Compression Strategy:**
    - Aggressive compression with semantic preservation
    - Force-token mechanism to preserve critical terms
    - Target compression rate (default 0.5 = 50% size reduction)

    **Example:**
    ```json
    {
      "prompt": "You are a helpful assistant...",
      "rate": 0.5,
      "force_tokens": ["assistant", "helpful"]
    }
    ```

    **Response:**
    ```json
    {
      "compressed_prompt": "helpful assistant...",
      "original_length": 100,
      "compressed_length": 50,
      "compression_ratio": 0.5,
      "savings_tokens": 50
    }
    ```
    """
    try:
        # Get singleton model instance (loaded during startup)
        compressor = LLMLinguaModel.get_instance()

        # Perform compression
        # Note: LLMLingua uses 'instruction' parameter for the prompt to compress
        # and 'rate' for target compression ratio
        compressed_result = compressor.compress_prompt(
            [request.prompt],  # LLMLingua expects list of strings
            rate=request.rate,
            force_tokens=request.force_tokens if request.force_tokens else [],
        )

        # Extract metrics
        compressed_text = compressed_result["compressed_prompt"]
        original_tokens = len(request.prompt.split())  # Approximate token count
        compressed_tokens = len(compressed_text.split())  # Approximate token count
        actual_ratio = compressed_tokens / original_tokens if original_tokens > 0 else 0.0
        savings = original_tokens - compressed_tokens

        return CompressionResponse(
            compressed_prompt=compressed_text,
            original_length=original_tokens,
            compressed_length=compressed_tokens,
            compression_ratio=round(actual_ratio, 3),
            savings_tokens=savings,
        )
    except Exception as e:
        # LLMLingua may fail on Python 3.14 due to transformers compatibility
        # Return error via HTTPException
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"Compression model error (Python 3.14 compatibility): {str(e)}"
        )
