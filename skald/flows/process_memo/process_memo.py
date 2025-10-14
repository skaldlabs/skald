import hashlib
import json
import logging
import os
from datetime import datetime
from typing import NotRequired, TypedDict

import redis
from chonkie import RecursiveChunker
from django.db import transaction

from skald.models.memo import Memo, MemoContent
from skald.models.project import Project
from skald.settings import (
    AWS_REGION,
    REDIS_HOST,
    REDIS_MEMO_PROCESSING_PUB_SUB_CHANNEL,
    REDIS_PORT,
    SQS_QUEUE_URL,
    USE_SQS,
)

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

logger = logging.getLogger(__name__)

# Initialize SQS client if in production mode
sqs_client = None
if SQS_QUEUE_URL and USE_SQS:
    import boto3

    sqs_client = boto3.client("sqs", region_name=AWS_REGION)
    logger.info(f"Initialized SQS client for queue: {SQS_QUEUE_URL}")


class MemoData(TypedDict):
    content: str
    title: str
    metadata: NotRequired[dict | None]
    reference_id: NotRequired[str | None]
    tags: NotRequired[list[str] | None]
    source: NotRequired[str | None]
    expiration_date: NotRequired[datetime | None]


chunker = RecursiveChunker.from_recipe(
    "markdown", chunk_size=4096, min_characters_per_chunk=128
)


def _create_memo_object(memo: MemoData, project: Project) -> Memo:
    with transaction.atomic():
        memo_object = Memo.objects.create(
            title=memo["title"],
            metadata=memo.get("metadata", {}),
            client_reference_id=memo.get("reference_id"),
            source=memo.get("source"),
            expiration_date=memo.get("expiration_date"),
            content_length=len(memo["content"]),
            content_hash=hashlib.sha256(memo["content"].encode()).hexdigest(),
            project=project,
            pending=False,
        )
        MemoContent.objects.create(
            memo=memo_object,
            content=memo["content"],
            project=project,
        )
    return memo_object


def _publish_to_redis(memo_uuid: str) -> None:
    """Publish memo to Redis pub/sub channel (development mode)"""
    message = json.dumps({"memo_uuid": str(memo_uuid)})
    redis_client.publish(REDIS_MEMO_PROCESSING_PUB_SUB_CHANNEL, message)
    logger.info(f"Published memo {memo_uuid} to Redis process_memo channel")


def _publish_to_sqs(memo_uuid: str) -> None:
    """Publish memo to SQS queue (production mode)"""
    if not sqs_client:
        raise Exception("SQS client not available")

    message = json.dumps({"memo_uuid": str(memo_uuid)})
    response = sqs_client.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=message)
    logger.info(f"Published memo {memo_uuid} to SQS queue: {response['MessageId']}")


def create_new_memo(memo_data: MemoData, project: Project) -> Memo:
    memo = _create_memo_object(memo_data, project)

    if USE_SQS:
        _publish_to_sqs(memo.uuid)
    else:
        _publish_to_redis(memo.uuid)

    return memo
