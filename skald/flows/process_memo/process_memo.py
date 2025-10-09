from skald.models.memo import Memo, MemoChunk, MemoSummary, MemoTag, MemoChunkKeyword, MemoRelationship, MemoChunkKeyword, MemoContent  
from skald.embeddings.generate_embedding import generate_vector_embedding_for_storage

import hashlib
from typing import TypedDict, NotRequired
from datetime import datetime
import time
import json
import redis
import os

from chonkie import RecursiveChunker
import asyncio
from agents import Runner
from skald.flows.process_memo.memo_agents.keyword_extractor_agent import keyword_extractor_agent
from skald.flows.process_memo.memo_agents.memo_summary_agent import memo_summary_agent
from skald.flows.process_memo.memo_agents.memo_tags_agent import memo_tags_agent
from skald.flows.process_memo.memo_agents.knowledge_base_update_agent import knowledge_base_update_agent
from django.db import transaction
from openai.types.responses import ResponseTextDeltaEvent

# Initialize Redis client
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)

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
    with transaction.atomic():
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
    




def create_new_memo(memo_data: MemoData) -> Memo:
    memo = _create_memo_object(memo_data)
        
    # Publish to Redis pub/sub after successful transaction
    message = json.dumps({
        'memo_uuid': str(memo.uuid),
    })
    redis_client.publish('process_memo', message)
    print(f"Published memo {memo.uuid} to process_memo channel")
            
    return memo