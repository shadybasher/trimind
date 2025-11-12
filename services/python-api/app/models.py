"""Singleton model loader for LLMLingua-2 compression."""

from typing import Optional
from llmlingua import PromptCompressor
from app.config import settings


class LLMLinguaModel:
    """Singleton wrapper for LLMLingua-2 model to avoid reloading."""

    _instance: Optional[PromptCompressor] = None

    @classmethod
    def get_instance(cls) -> PromptCompressor:
        """Get or create the singleton LLMLingua-2 model instance."""
        if cls._instance is None:
            cls._instance = PromptCompressor(
                model_name=settings.llmlingua_model_name,
                device_map="cpu",  # Use CPU for compatibility
            )
        return cls._instance

    @classmethod
    def is_loaded(cls) -> bool:
        """Check if the model is already loaded."""
        return cls._instance is not None
