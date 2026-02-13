import { randomUUID } from 'crypto'
import { createClient } from 'redis'
import * as amqplib from 'amqplib'
import { sha256 } from '@/lib/hashUtils'
import { DI } from '@/di'
import { Memo } from '@/entities/Memo'
import { MemoContent } from '@/entities/MemoContent'
import { MemoTag } from '@/entities/MemoTag'
import { Project } from '@/entities/Project'
import {
    INTER_PROCESS_QUEUE,
    REDIS_HOST,
    REDIS_PORT,
    CHANNEL_NAME,
    SQS_QUEUE_URL,
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASSWORD,
    RABBITMQ_VHOST,
    RABBITMQ_QUEUE_NAME,
    TEST,
} from '../settings'
import { logger } from './logger'
import { EntityData } from '@mikro-orm/core'
import { generateS3Key, uploadFileToS3 } from './s3Utils'
import { publishMessage } from '@/lib/sqsClient'
import { sanitizeFilenameForS3Metadata } from '@/lib/filenameUtils'

export interface MemoData {
    content?: string
    title: string
    metadata?: Record<string, any> | null
    reference_id?: string | null
    tags?: string[] | null
    source?: string | null
    expiration_date?: Date | null
    type: string
    scopes?: Record<string, string> | null
}

export type MemoCreationData = Pick<
    Memo,
    | 'uuid'
    | 'title'
    | 'metadata'
    | 'scopes'
    | 'client_reference_id'
    | 'source'
    | 'expiration_date'
    | 'project'
    | 'archived'
    | 'created_at'
    | 'updated_at'
    | 'content_length'
    | 'content_hash'
    | 'type'
    | 'processing_status'
    | 'processing_error'
    | 'processing_started_at'
    | 'processing_completed_at'
>

async function _createMemoObject(memoData: MemoData, project: Project): Promise<Memo> {
    const em = DI.em.fork()

    try {
        await em.begin()

        const memoCreationData: MemoCreationData = {
            uuid: randomUUID(),
            title: memoData.title,
            metadata: memoData.metadata || {},
            scopes: memoData.scopes ?? undefined,
            client_reference_id: memoData.reference_id,
            source: memoData.source,
            expiration_date: memoData.expiration_date,
            type: memoData.type,
            project,
            processing_status: 'received',
            processing_error: undefined,
            processing_started_at: undefined,
            processing_completed_at: undefined,
            archived: false,
            created_at: new Date(),
            updated_at: new Date(),
        }

        if (memoData.content) {
            memoCreationData.content_length = memoData.content.length
            memoCreationData.content_hash = sha256(memoData.content)
        }

        const memo = em.create(Memo, memoCreationData)

        const entitiesToFlush: EntityData<Memo | MemoContent | MemoTag>[] = [memo]

        // for document uploads we don't set content yet, it gets set after extraction
        if (memoData.content) {
            const memoContent = em.create(MemoContent, {
                uuid: randomUUID(),
                memo,
                content: memoData.content,
                project,
            })
            entitiesToFlush.push(memoContent)
        }

        const memoTags = (memoData.tags || []).map((tag) =>
            em.create(MemoTag, {
                uuid: randomUUID(),
                memo,
                tag,
                project,
            })
        )
        entitiesToFlush.push(...memoTags)

        await em.persistAndFlush(entitiesToFlush)
        await em.commit()

        return memo
    } catch (error) {
        await em.rollback()
        throw error
    }
}

async function _publishToRedis(memoUuid: string): Promise<void> {
    const message = JSON.stringify({ memo_uuid: memoUuid })
    const redisClient = createClient({
        socket: {
            host: REDIS_HOST,
            port: REDIS_PORT,
        },
    })

    await redisClient.connect()
    await redisClient.publish(CHANNEL_NAME, message)
    await redisClient.quit()

    logger.info({ memoUuid }, 'Published memo to Redis process_memo channel')
}

async function _publishToSqs(memoUuid: string): Promise<void> {
    if (!SQS_QUEUE_URL) {
        throw new Error('SQS queue URL not available')
    }

    const message = JSON.stringify({ memo_uuid: memoUuid })
    const response = await publishMessage(message, SQS_QUEUE_URL)
    logger.info({ memoUuid, messageId: response.MessageId }, 'Published memo to SQS queue')
}

async function _publishToRabbitmq(memoUuid: string): Promise<void> {
    const credentials = amqplib.credentials.plain(RABBITMQ_USER, RABBITMQ_PASSWORD)
    const url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`

    const connection = await amqplib.connect(url, {
        credentials,
    })
    const channel = await connection.createChannel()

    await channel.assertQueue(RABBITMQ_QUEUE_NAME, {
        durable: true,
    })

    const message = JSON.stringify({ memo_uuid: memoUuid })
    channel.sendToQueue(RABBITMQ_QUEUE_NAME, Buffer.from(message), {
        persistent: true,
    })

    logger.info({ memoUuid, queueName: RABBITMQ_QUEUE_NAME }, 'Published memo to RabbitMQ queue')

    await channel.close()
    await connection.close()
}

export async function sendMemoForAsyncProcessing(memo: Memo, origin: string): Promise<void> {
    if (TEST) {
        return
    }
    logger.info({ memoUuid: memo.uuid, origin }, 'Sending memo for async processing')
    if (INTER_PROCESS_QUEUE === 'sqs') {
        await _publishToSqs(memo.uuid)
    } else if (INTER_PROCESS_QUEUE === 'redis') {
        await _publishToRedis(memo.uuid)
    } else if (INTER_PROCESS_QUEUE === 'rabbitmq') {
        await _publishToRabbitmq(memo.uuid)
    } else {
        throw new Error(`Invalid inter-process queue: ${INTER_PROCESS_QUEUE}`)
    }
}

export async function createNewMemo(memoData: MemoData, project: Project): Promise<Memo> {
    const memo = await _createMemoObject(memoData, project)
    await sendMemoForAsyncProcessing(memo, 'create_new_memo')
    return memo
}

export const createNewDocumentMemo = async (
    memoData: MemoData,
    project: Project,
    file: Express.Multer.File
): Promise<Memo> => {
    const memo = await _createMemoObject(memoData, project)

    const s3Key = generateS3Key(project.uuid, memo.uuid)
    const sanitizedFilename = sanitizeFilenameForS3Metadata(file.originalname)
    await uploadFileToS3(file.buffer, s3Key, file.mimetype, {
        'memo-uuid': memo.uuid,
        'project-uuid': project.uuid,
        'original-filename': sanitizedFilename,
    })

    await sendMemoForAsyncProcessing(memo, 'create_new_document_memo')
    return memo
}
