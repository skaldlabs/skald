import hashlib
import json
import logging
from datetime import datetime
from typing import NotRequired, TypedDict

import redis
from django.db import transaction

from skald.models.memo import Memo, MemoContent, MemoTag
from skald.models.project import Project
from skald.settings import (
    AWS_REGION,
    INTER_PROCESS_QUEUE,
    REDIS_HOST,
    REDIS_MEMO_PROCESSING_PUB_SUB_CHANNEL,
    REDIS_PORT,
    SQS_QUEUE_URL,
)

logger = logging.getLogger(__name__)

sqs_client = None
if SQS_QUEUE_URL and INTER_PROCESS_QUEUE == "sqs":
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
        for tag in memo.get("tags", []):
            MemoTag.objects.create(
                memo=memo_object,
                tag=tag,
                project=project,
            )
    return memo_object


def _publish_to_redis(memo_uuid: str) -> None:
    """Publish memo to Redis pub/sub channel (development mode)"""
    message = json.dumps({"memo_uuid": str(memo_uuid)})
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_client.publish(REDIS_MEMO_PROCESSING_PUB_SUB_CHANNEL, message)
    logger.info(f"Published memo {memo_uuid} to Redis process_memo channel")


def _publish_to_sqs(memo_uuid: str) -> None:
    """Publish memo to SQS queue (production mode)"""
    if not sqs_client:
        raise Exception("SQS client not available")

    message = json.dumps({"memo_uuid": str(memo_uuid)})
    response = sqs_client.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=message)
    logger.info(f"Published memo {memo_uuid} to SQS queue: {response['MessageId']}")


def _publish_to_rabbitmq(memo_uuid: str) -> None:
    """Publish memo to RabbitMQ queue"""
    import pika

    from skald.settings import (
        RABBITMQ_HOST,
        RABBITMQ_PASSWORD,
        RABBITMQ_PORT,
        RABBITMQ_USER,
        RABBITMQ_VHOST,
    )

    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=int(RABBITMQ_PORT),
        virtual_host=RABBITMQ_VHOST,
        credentials=credentials,
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare the queue (idempotent operation)
    queue_name = "process_memo"
    channel.queue_declare(queue=queue_name, durable=True)

    # Publish the message
    message = json.dumps({"memo_uuid": str(memo_uuid)})
    channel.basic_publish(
        exchange="",
        routing_key=queue_name,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # make message persistent
        ),
    )

    logger.info(f"Published memo {memo_uuid} to RabbitMQ queue: {queue_name}")

    connection.close()


def send_memo_for_async_processing(memo: Memo) -> None:
    if INTER_PROCESS_QUEUE == "sqs":
        _publish_to_sqs(memo.uuid)
    elif INTER_PROCESS_QUEUE == "redis":
        _publish_to_redis(memo.uuid)
    elif INTER_PROCESS_QUEUE == "rabbitmq":
        _publish_to_rabbitmq(memo.uuid)
    else:
        raise ValueError(f"Invalid inter-process queue: {INTER_PROCESS_QUEUE}")


def create_new_memo(memo_data: MemoData, project: Project) -> Memo:
    memo = _create_memo_object(memo_data, project)

    send_memo_for_async_processing(memo)

    return memo
