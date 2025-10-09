from agents import Agent, ModelSettings, function_tool
from pydantic import BaseModel
from typing import Literal  

from skald.models.memo import Memo, MemoChunkKeyword, MemoContent
from skald.embeddings.generate_embedding import generate_vector_embedding_for_search
from skald.embeddings.vector_search import memo_chunk_vector_search, memo_summary_vector_search
from agents import enable_verbose_stdout_logging

enable_verbose_stdout_logging()

class KnowledgeBaseUpdateAction(BaseModel):
    action: Literal["INSERT", "DELETE", "UPDATE"]
    memo_uuid: str
    reason: str
    content: str

class KnowledgeBaseUpdateAgentOutput(BaseModel):
    actions: list[KnowledgeBaseUpdateAction]


KNOWLEDGE_BASE_UPDATE_AGENT_INSTRUCTIONS = """
You're an expert knowledge manager that keeps a knowledge base up to date.

You oversee a knowledge base of memos, which can be documents, notes, and other types of text content.

When a new memo is added to the knowledge base, you must determine if the knowledge base needs to be updated due to a conflict between the new memo and the existing memos in the knowledge base.

You can perform the following actions:
1. INSERT: Insert a new memo into the knowledge base
2. DELETE: Delete a memo from the knowledge base
3. UPDATE: Update a memo in the knowledge base

These actions can apply to the new memo, or to an existing memo in the knowledge base.

You can perform as many actions as necessary to keep the knowledge base up to date. You can also perform no actions.

In order to determine the necessary actions, you can explore the knowledge base using the following tools:

- get_memo_titles_by_tag: Get all the titles of the memos in the knowledge base that are tagged with a given tag
- vector_search: Perform a vector search on the knowledge base for memos that are similar to the new memo
- summary_vector_search: Perform a vector search on the knowledge base for summaries of memos that are similar to the summary of the new memo
- keyword_search: Perform a keyword search on the knowledge base for memos that contain a given keyword
- get_memo_metadata: Get metadata for a given memo, including the title and the summary
- get_memo_content: Get the full raw content of a given memo

Your output should be a list of actions to perform, with a short and concise reason for each action.

Rules:

- For INSERT actions, memo_uuid should be None and content should be the full raw content of the new memo
- For DELETE actions, memo_uuid should be the uuid of the memo to delete
- For UPDATE actions, memo_uuid should be the uuid of the memo to update, and content should be the full new content of the memo
- You can perform no actions if there are no conflicts between the new memo and the existing memos in the knowledge base.
- You can perform as many actions as necessary.
- You should never INSERT the current memo, but you can DELETE or UPDATE it.
"""


@function_tool
def get_memo_titles_by_tag(tag: str) -> list[dict]:
    print('get_memo_titles_by_tag called! tag:', tag, 'returning memos', [memo.uuid for memo in memos])

    memos = Memo.objects.filter(memotag__tag=tag).distinct()
    return [
        {
            "title": memo.title,
            "uuid": str(memo.uuid),
        }
        for memo in memos
    ]
    
@function_tool
def get_memo_metadata(memo_uuid: str) -> dict:
    print('get_memo_metadata called!', 'returning metadata of memo', memo.uuid)
    memo = Memo.objects.get(uuid=memo_uuid)
    return memo.metadata


@function_tool
def get_memo_content(memo_uuid: str) -> str:
    print('get_memo_content called!', 'returning content of memo', memo_uuid)

    memo_content = MemoContent.objects.filter(memo__uuid=memo_uuid).first()
    
    return memo_content.content if memo_content else ""


@function_tool
def keyword_search(query: str) -> list[dict]:
    memos = Memo.objects.filter(memochunk__memochunkkeyword__keyword__icontains=query).distinct()
    print('keyword_search called! query:', query, 'returning memos', [memo.uuid for memo in memos])
    return [
        {
            "title": memo.title,
            "uuid": str(memo.uuid),
        }
        for memo in memos
    ]

@function_tool
def summary_vector_search(query: str) -> list[dict]:
    embedding_vector = generate_vector_embedding_for_search(query)
    memo_summaries = memo_summary_vector_search(embedding_vector)
    print('summary_vector_search called! query:', query, 'returning memo_summaries', [memo_summary.memo.uuid for memo_summary in memo_summaries])
    return [
        {
            "title": memo_summary.memo.title,
            "uuid": str(memo_summary.memo.uuid),
            "summary": memo_summary.summary,
        }
        for memo_summary in memo_summaries
    ]


@function_tool
def vector_search(query: str) -> list[dict]:
    embedding_vector = generate_vector_embedding_for_search(query)
    memo_chunks = memo_chunk_vector_search(embedding_vector)
    print('vector_search called! query:', query, 'returning memo_chunks', [memo_chunk.memo.uuid for memo_chunk in memo_chunks])
    return [
        {
            "title": memo_chunk.memo.title,
            "uuid": str(memo_chunk.memo.uuid),
            "chunk_index": memo_chunk.chunk_index,
        }
        for memo_chunk in memo_chunks
    ]


knowledge_base_update_agent = Agent(
    name="Knowledge Base Update Agent",
    instructions=KNOWLEDGE_BASE_UPDATE_AGENT_INSTRUCTIONS,
    # model="gpt-5-nano",
    output_type=KnowledgeBaseUpdateAgentOutput,
    tools=[get_memo_titles_by_tag, get_memo_metadata, get_memo_content, keyword_search, summary_vector_search, vector_search],
    model_settings=ModelSettings(tool_choice="required"),
    
)