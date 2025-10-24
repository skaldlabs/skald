import asyncio
from typing import Any, AsyncIterator, Dict, Iterator

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

from skald.agents.chat_agent.prompts import CHAT_AGENT_INSTRUCTIONS
from skald.agents.streaming import AsyncStreamingCallbackHandler
from skald.services.llm_service import LLMService


def create_chat_agent(streaming: bool = False, callback_handler=None):

    # Initialize the LLM with optional streaming
    llm = LLMService.get_llm(
        streaming=streaming, callbacks=[callback_handler] if callback_handler else None
    )

    # Define the tools
    # tools = [greet, get_current_time]

    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", CHAT_AGENT_INSTRUCTIONS),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    # Create the agent using the modern tool calling format
    agent = create_tool_calling_agent(llm, [], prompt)

    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent, tools=[], verbose=True, return_intermediate_steps=True
    )

    return agent_executor


def run_chat_agent(query: str, context: str = "") -> dict:
    """
    Run the chat agent with a given query and context.

    Args:
        query: The user's question or message
        context: The context information to use for answering

    Returns:
        dict: The agent's response including output and intermediate steps
    """
    agent_executor = create_chat_agent()

    result = agent_executor.invoke({"input": query, "context": context})

    return result


async def async_stream_chat_agent(
    query: str, context: str = ""
) -> AsyncIterator[Dict[str, Any]]:
    """
    Async stream the chat agent response with a given query.

    Args:
        query: The user's question or message
        context: The context information to use for answering

    Yields:
        dict: Streaming chunks of the agent's response
    """
    callback_handler = AsyncStreamingCallbackHandler()
    agent_executor = create_chat_agent(
        streaming=True, callback_handler=callback_handler
    )

    # Create task for agent execution
    agent_task = asyncio.create_task(_run_agent_async(agent_executor, query, context))

    # Stream events as they arrive
    while True:
        try:
            # Get event with timeout to check agent status
            event = await asyncio.wait_for(
                callback_handler.event_queue.get(), timeout=0.1
            )

            if event is None:  # Sentinel value
                break

            yield event

        except asyncio.TimeoutError:
            # Check if agent is done
            if agent_task.done():
                # Drain any remaining events
                while not callback_handler.event_queue.empty():
                    event = await callback_handler.event_queue.get()
                    if event is not None:
                        yield event
                break
            continue

    # Get the final result
    try:
        result = await agent_task
        if result.get("output"):
            output = result.get("output", "")
            # Extract string from output if it's a list (Anthropic format)
            if isinstance(output, list) and len(output) > 0:
                if isinstance(output[0], dict):
                    output = (
                        output[0].get("text") or output[0].get("content") or str(output)
                    )
            yield {"type": "output", "content": output}
    except Exception as e:
        yield {"type": "error", "content": str(e)}


async def _run_agent_async(agent_executor, query: str, context: str = ""):
    """Helper to run agent asynchronously."""
    result = await agent_executor.ainvoke({"input": query, "context": context})
    return result


def stream_chat_agent(query: str, context: str = "") -> Iterator[Dict[str, Any]]:
    """
    Stream the chat agent response with a given query (sync wrapper).

    Args:
        query: The user's question or message
        context: The context information to use for answering

    Yields:
        dict: Streaming chunks of the agent's response
    """
    # Run async function in sync context
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        async_gen = async_stream_chat_agent(query, context)

        while True:
            try:
                chunk = loop.run_until_complete(async_gen.__anext__())
                yield chunk
            except StopAsyncIteration:
                break
    finally:
        loop.close()
