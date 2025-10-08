from skald.models.memo import Memo, MemoChunk, MemoSummary, MemoTag, MemoChunkKeyword, MemoRelationship, MemoChunkKeyword, MemoContent  
from skald.embeddings.generate_embedding import generate_vector_embedding_for_storage

import hashlib
from typing import TypedDict, NotRequired
from datetime import datetime

from chonkie import RecursiveChunker
import asyncio
from agents import Runner
from skald.flows.process_memo.memo_agents.keyword_extractor_agent import keyword_extractor_agent
from skald.flows.process_memo.memo_agents.memo_summary_agent import memo_summary_agent
from skald.flows.process_memo.memo_agents.memo_tags_agent import memo_tags_agent

from django.db import transaction

class MemoData(TypedDict):
    content: str
    title: str
    metadata: NotRequired[dict | None]
    reference_id: NotRequired[str | None]
    tags: NotRequired[list[str] | None]
    source: NotRequired[str | None]
    expiration_date: NotRequired[datetime | None]


chunker = RecursiveChunker.from_recipe("markdown", chunk_size=4096, min_characters_per_chunk=128)



def _create_memo_object(memo: MemoData) -> Memo:
    memo_object = Memo.objects.create(
        title=memo['title'],
        metadata=memo.get('metadata'),
        client_reference_id=memo.get('reference_id'),
        source=memo.get('source'),
        expiration_date=memo.get('expiration_date'),
        content_length=len(memo['content']),
        content_hash=hashlib.sha256(memo['content'].encode()).hexdigest(),
    )
    MemoContent.objects.create(
        memo=memo_object,
        content=memo['content'],
    )
    return memo_object
    

def _chunk_memo_content(content: str):
    return chunker.chunk(content)

def _create_memo_chunk_keywords(memo_chunk: MemoChunk, chunk_text: str):
    keyword_extractor_agent_result = asyncio.run(Runner.run(keyword_extractor_agent, chunk_text))
    for keyword in keyword_extractor_agent_result.final_output.keywords:
        MemoChunkKeyword.objects.create(
            memo_chunk=memo_chunk,
            keyword=keyword,
        )
    
    

def _create_memo_chunks(memo: Memo, content: str):
    chunks = _chunk_memo_content(content)
    for index, chunk in enumerate(chunks):
        vector_embedding = generate_vector_embedding_for_storage(chunk.text)
        memo_chunk_object = MemoChunk.objects.create(
            memo=memo,
            chunk_content=chunk.text,
            chunk_index=index,
            embedding=vector_embedding,
        )
        _create_memo_chunk_keywords(memo_chunk_object, chunk.text)
    
def _create_memo_summary(memo: Memo, content: str):
    document_summary_agent_result = asyncio.run(Runner.run(memo_summary_agent, content))
    summary = document_summary_agent_result.final_output.summary
    vector_embedding = generate_vector_embedding_for_storage(summary)
    MemoSummary.objects.create(
        memo=memo,
        summary=summary,
        embedding=vector_embedding,
    )


def _create_memo_tags(memo: Memo, content: str):
    memo_tags_agent_result = asyncio.run(Runner.run(memo_tags_agent, content))
    for tag in memo_tags_agent_result.final_output.tags:
        MemoTag.objects.create(
            memo=memo,
            tag=tag,
        )

def create_new_memo(memo_data: MemoData) -> Memo:
    with transaction.atomic():  
        memo = _create_memo_object(memo_data)
        _create_memo_summary(memo, memo_data['content'])
        _create_memo_chunks(memo, memo_data['content'])
        _create_memo_tags(memo, memo_data['content'])


    
    
    
    return memo