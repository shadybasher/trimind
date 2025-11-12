"""Configuration management for Python API service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Security
    shared_secret: str

    # OpenAI (Primary for Intent Router)
    openai_api_key: str

    # Anthropic (Fallback for Intent Router)
    anthropic_api_key: str

    # Service Configuration
    api_v1_prefix: str = "/api/v1"
    service_name: str = "Trimind Python API"
    debug: bool = False

    # LLMLingua Model Configuration
    llmlingua_model_name: str = "microsoft/llmlingua-2-xlm-roberta-large-meetingbank"

    # Intent Router Configuration
    intent_router_primary_model: str = "gpt-4o-mini"
    intent_router_fallback_model: str = "claude-3-haiku-20240307"
    circuit_breaker_failure_threshold: int = 5
    circuit_breaker_timeout: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Global settings instance
# Note: Pydantic BaseSettings automatically loads values from environment variables
# mypy doesn't understand this magic, so we suppress the call-arg error
settings = Settings()  # type: ignore[call-arg]
