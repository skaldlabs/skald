import asyncio
import logging

from langchain.callbacks.base import AsyncCallbackHandler, BaseCallbackHandler

logger = logging.getLogger(__name__)


class AsyncStreamingCallbackHandler(AsyncCallbackHandler):
    """Async callback handler for streaming LLM responses."""

    def __init__(self):
        self.tokens = []
        self.token_queue = asyncio.Queue()
        self.event_queue = asyncio.Queue()

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""
        # Extract string content from token (handles various formats from different providers)
        if isinstance(token, str):
            token_str = token
        elif isinstance(token, list):
            if len(token) > 0 and isinstance(token[0], dict):
                token_str = (
                    token[0].get("text") or token[0].get("content") or str(token)
                )
            else:
                return
        elif isinstance(token, dict):
            # Handle dict-like tokens (extract text/content field)
            token_str = token.get("text") or token.get("content") or str(token)
        elif hasattr(token, "text"):
            # Handle object-like tokens with text attribute
            token_str = token.text
        elif hasattr(token, "content"):
            # Handle object-like tokens with content attribute
            token_str = token.content
        else:
            # Fallback to string conversion
            logger.warning(
                f"Unexpected token type: {type(token)}, value: {token}, kwargs: {kwargs}"
            )
            token_str = str(token)

        if not isinstance(token_str, str):
            logger.error(
                f"Failed to extract string from token. Type: {type(token_str)}, Value: {token_str}"
            )
            token_str = str(token_str)

        self.tokens.append(token_str)
        await self.event_queue.put({"type": "token", "content": token_str})

    async def on_tool_start(self, serialized, input_str: str, **kwargs) -> None:
        """Run when tool starts running."""
        tool_name = serialized.get("name", "unknown")
        await self.event_queue.put(
            {"type": "tool", "tool": tool_name, "input": input_str}
        )

    async def on_agent_finish(self, *args, **kwargs) -> None:
        """Signal end of agent execution."""
        await self.event_queue.put(None)  # Sentinel value
