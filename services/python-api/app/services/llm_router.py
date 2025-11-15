"""Multi-provider LLM Router with OpenAI, Anthropic, and Google Gemini support.

This module routes requests to appropriate LLM providers based on configuration.
Supports all three major providers with unified interface.
"""

from typing import Dict, Optional, List, Any
from enum import Enum
import os
import logging
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import google.generativeai as genai

logger = logging.getLogger(__name__)


class ProviderEnum(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"


class LLMRouter:
    """
    Multi-provider LLM router with intelligent routing.

    Supports:
    - OpenAI GPT-4o, GPT-4o-mini
    - Anthropic Claude 3.7 Sonnet
    - Google Gemini 2.0 Flash

    Example:
        router = LLMRouter()
        response = await router.route(
            provider="openai",
            messages=[{"role": "user", "content": "Hello!"}]
        )
        print(response["content"])
    """

    def __init__(self):
        """Initialize LLM clients for all providers."""
        # OpenAI Client
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("OPENAI_API_KEY not set - OpenAI provider disabled")
            self.openai_client = None
        else:
            self.openai_client = AsyncOpenAI(api_key=openai_api_key)
            logger.info("OpenAI client initialized")

        # Anthropic Client
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            logger.warning("ANTHROPIC_API_KEY not set - Anthropic provider disabled")
            self.anthropic_client = None
        else:
            self.anthropic_client = AsyncAnthropic(api_key=anthropic_api_key)
            logger.info("Anthropic client initialized")

        # Google Gemini Client
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            logger.warning("GOOGLE_API_KEY not set - Google provider disabled")
            self.gemini_model = None
        else:
            genai.configure(api_key=google_api_key)
            self.gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
            logger.info("Google Gemini client initialized")

    async def route(
        self,
        provider: str,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Route request to appropriate LLM provider.

        Args:
            provider: Provider to use (openai/anthropic/google)
            messages: List of message dicts with "role" and "content"
            model: Optional model override
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Returns:
            Unified response dict with:
                - content: Generated text
                - model: Model used
                - provider: Provider used
                - tokens: Token usage stats

        Raises:
            ValueError: If provider is unsupported or disabled
            Exception: If LLM API call fails
        """
        provider_enum = ProviderEnum(provider.lower())

        if provider_enum == ProviderEnum.OPENAI:
            return await self._call_openai(
                messages, model, temperature, max_tokens, **kwargs
            )
        elif provider_enum == ProviderEnum.ANTHROPIC:
            return await self._call_anthropic(
                messages, model, temperature, max_tokens, **kwargs
            )
        elif provider_enum == ProviderEnum.GOOGLE:
            return await self._call_gemini(
                messages, model, temperature, max_tokens, **kwargs
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def _call_openai(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs,
    ) -> Dict:
        """
        Call OpenAI GPT API.

        Args:
            messages: Chat messages
            model: Model name (default: gpt-4o)
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            **kwargs: Additional parameters

        Returns:
            Unified response dict

        Raises:
            ValueError: If OpenAI client not initialized
            Exception: If API call fails
        """
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized - check OPENAI_API_KEY")

        model = model or "gpt-4o"
        logger.info(f"Calling OpenAI {model}")

        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )

            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "provider": "openai",
                "tokens": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens,
                },
            }
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}", exc_info=True)
            raise

    async def _call_anthropic(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs,
    ) -> Dict:
        """
        Call Anthropic Claude API.

        Args:
            messages: Chat messages
            model: Model name (default: claude-3-7-sonnet-20250219)
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            **kwargs: Additional parameters

        Returns:
            Unified response dict

        Raises:
            ValueError: If Anthropic client not initialized
            Exception: If API call fails
        """
        if not self.anthropic_client:
            raise ValueError(
                "Anthropic client not initialized - check ANTHROPIC_API_KEY"
            )

        model = model or "claude-3-7-sonnet-20250219"
        logger.info(f"Calling Anthropic {model}")

        try:
            response = await self.anthropic_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=messages,
                **kwargs,
            )

            return {
                "content": response.content[0].text,
                "model": response.model,
                "provider": "anthropic",
                "tokens": {
                    "prompt": response.usage.input_tokens,
                    "completion": response.usage.output_tokens,
                    "total": response.usage.input_tokens + response.usage.output_tokens,
                },
            }
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}", exc_info=True)
            raise

    async def _call_gemini(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs,
    ) -> Dict:
        """
        Call Google Gemini API.

        Args:
            messages: Chat messages
            model: Model name (currently only gemini-2.0-flash-exp supported)
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            **kwargs: Additional parameters

        Returns:
            Unified response dict

        Raises:
            ValueError: If Gemini client not initialized
            Exception: If API call fails
        """
        if not self.gemini_model:
            raise ValueError("Gemini client not initialized - check GOOGLE_API_KEY")

        model = model or "gemini-2.0-flash-exp"
        logger.info(f"Calling Google Gemini {model}")

        try:
            # Convert chat messages to Gemini format (simple concatenation for now)
            # Gemini API has different message format - we'll use the user's last message
            user_message = messages[-1]["content"] if messages else ""

            # Generate response
            response = await self.gemini_model.generate_content_async(
                user_message,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )

            return {
                "content": response.text,
                "model": model,
                "provider": "google",
                "tokens": {
                    "prompt": response.usage_metadata.prompt_token_count,
                    "completion": response.usage_metadata.candidates_token_count,
                    "total": response.usage_metadata.total_token_count,
                },
            }
        except Exception as e:
            logger.error(f"Google Gemini API error: {str(e)}", exc_info=True)
            raise

    def select_provider(
        self, user_preference: Optional[str] = None, intent: Optional[str] = None
    ) -> ProviderEnum:
        """
        Intelligent provider selection based on preferences and intent.

        Args:
            user_preference: User's preferred provider
            intent: Classified intent (code/creative/general/etc.)

        Returns:
            Selected provider enum

        Strategy:
            1. Honor user preference if specified
            2. Route by intent:
               - code → Anthropic (Claude excels at code)
               - creative → OpenAI (GPT-4 for creative tasks)
               - multimodal → Google (Gemini for vision)
            3. Default: Google Gemini 2.0 Flash (fast + cheap)
        """
        # Honor user preference
        if user_preference:
            try:
                return ProviderEnum(user_preference.lower())
            except ValueError:
                logger.warning(
                    f"Invalid user preference: {user_preference}, using default"
                )

        # Intent-based routing
        if intent:
            intent_lower = intent.lower()
            if "code" in intent_lower or "programming" in intent_lower:
                return ProviderEnum.ANTHROPIC
            elif "creative" in intent_lower or "story" in intent_lower:
                return ProviderEnum.OPENAI
            elif "image" in intent_lower or "vision" in intent_lower:
                return ProviderEnum.GOOGLE

        # Default: Gemini 2.0 Flash (best balance of speed/cost/quality)
        return ProviderEnum.GOOGLE
