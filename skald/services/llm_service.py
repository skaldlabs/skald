from typing import Optional

from django.conf import settings
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI


class LLMService:
    """Service for creating LLM instances based on configuration."""

    @staticmethod
    def get_llm(
        streaming: bool = False, callbacks: Optional[list] = None
    ) -> BaseChatModel:
        """
        Create an LLM instance based on environment configuration.

        Args:
            streaming: Enable streaming responses
            callbacks: Optional callback handlers

        Returns:
            Configured LLM instance
        """
        provider = settings.LLM_PROVIDER

        # Common kwargs
        llm_kwargs = {
            "temperature": 0,  # Always 0 for deterministic output
            "streaming": streaming,
        }

        if callbacks:
            llm_kwargs["callbacks"] = callbacks

        if provider == "openai":
            return ChatOpenAI(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
                **llm_kwargs,
            )

        elif provider == "anthropic":
            return ChatAnthropic(
                model=settings.ANTHROPIC_MODEL,
                api_key=settings.ANTHROPIC_API_KEY,
                **llm_kwargs,
            )

        elif provider == "local":
            # Local LLM with OpenAI-compatible API
            # Works with: Ollama, LM Studio, vLLM, LocalAI, etc.
            return ChatOpenAI(
                model=settings.LOCAL_LLM_MODEL,
                base_url=settings.LOCAL_LLM_BASE_URL,
                api_key=settings.LOCAL_LLM_API_KEY or "not-needed",
                **llm_kwargs,
            )

        else:
            raise ValueError(
                f"Unsupported LLM provider: {provider}. "
                f"Supported providers: openai, anthropic, local"
            )
