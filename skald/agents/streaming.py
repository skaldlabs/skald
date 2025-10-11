import asyncio

from langchain.callbacks.base import AsyncCallbackHandler, BaseCallbackHandler


class AsyncStreamingCallbackHandler(AsyncCallbackHandler):
    """Async callback handler for streaming LLM responses."""

    def __init__(self):
        self.tokens = []
        self.token_queue = asyncio.Queue()
        self.event_queue = asyncio.Queue()

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""
        self.tokens.append(token)
        await self.event_queue.put({"type": "token", "content": token})

    async def on_tool_start(self, serialized, input_str: str, **kwargs) -> None:
        """Run when tool starts running."""
        tool_name = serialized.get("name", "unknown")
        await self.event_queue.put(
            {"type": "tool", "tool": tool_name, "input": input_str}
        )

    async def on_agent_finish(self, *args, **kwargs) -> None:
        """Signal end of agent execution."""
        await self.event_queue.put(None)  # Sentinel value
