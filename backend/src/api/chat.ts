import { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { prepareContextForChatAgent } from '@/agents/chatAgent/preprocessing'
import { runChatAgent, streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { IS_DEVELOPMENT } from '@/settings'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { ChatMessage } from '@/entities/ChatMessage'
import { DI } from '@/di'
import { Project } from '@/entities/Project'
import { Chat } from '@/entities/Chat'
import { randomUUID } from 'crypto'

export const chat = async (req: Request, res: Response) => {
    const query = req.body.query
    const stream = req.body.stream || false
    const filters = req.body.filters || []
    const chatId = req.body.chat_id
    const clientSystemPrompt = req.body.system_prompt || null

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    if (!Array.isArray(filters)) {
        return res.status(400).json({ error: 'Filters must be a list' })
    }

    const project = req.context?.requestUser?.project
    if (!project) {
        // we should never get here, but do this for type safety and extra security
        return res.status(404).json({ error: 'Project not found' })
    }

    const memoFilters = []
    for (const filter of filters) {
        const { filter: memoFilter, error } = parseFilter(filter)
        if (memoFilter && !error) {
            memoFilters.push(memoFilter)
        } else {
            return res.status(400).json({ error: `Invalid filter: ${error}` })
        }
    }

    const rerankedResults = await prepareContextForChatAgent(query, project, memoFilters)

    let contextStr = ''
    for (let i = 0; i < rerankedResults.length; i++) {
        contextStr += `Result ${i + 1}: ${rerankedResults[i].document}\n\n`
    }

    try {
        if (stream) {
            const fullResponse = await _generateStreamingResponse(query, contextStr, clientSystemPrompt, res)
            await _createChatMessagePair(project, query, fullResponse, chatId)
            res.end()
        } else {
            // non-streaming response
            const result = await runChatAgent(query, contextStr, clientSystemPrompt)
            await _createChatMessagePair(project, query, result.output, chatId)

            return res.status(200).json({
                ok: true,
                response: result.output,
                intermediate_steps: result.intermediate_steps || [],
            })
        }
    } catch (error) {
        logger.error({ err: error }, 'Chat agent error')
        Sentry.captureException(error)
        return res.status(503).json({ error: 'Chat agent unavailable' })
    }
}

export const _setStreamingResponseHeaders = (res: Response) => {
    // set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
}

export const _generateStreamingResponse = async (
    query: string,
    contextStr: string,
    clientSystemPrompt: string | null = null,
    res: Response
): Promise<string> => {
    _setStreamingResponseHeaders(res)

    // establish connection
    res.write(': ping\n\n')

    let fullResponse = ''
    try {
        for await (const chunk of streamChatAgent(query, contextStr, clientSystemPrompt)) {
            // KLUDGE: we shouldn't do this type of handling here, this should be the responsibility of streamChatAgent
            if (chunk.content && typeof chunk.content === 'object') {
                // extract text from dict (Anthropic format)
                const content = chunk.content as any
                chunk.content = content.text || content.content || String(content)
            } else if (chunk.content && typeof chunk.content !== 'string') {
                chunk.content = String(chunk.content)
            }

            // format as Server-Sent Event
            const data = JSON.stringify(chunk)
            res.write(`data: ${data}\n\n`)
            fullResponse += chunk.content || ''
        }
    } catch (error) {
        logger.error({ err: error }, 'Streaming chat agent error')
        const errorMsg =
            IS_DEVELOPMENT && error instanceof Error ? `${error.message}\n${error.stack}` : 'An error occurred'
        const errorData = JSON.stringify({ type: 'error', content: errorMsg })
        res.write(`data: ${errorData}\n\n`)
    } finally {
        // send a done event
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    }
    return fullResponse
}

export const _createChatMessagePair = async (
    project: Project,
    userMessage: string,
    modelMessage: string,
    chatId?: string
): Promise<void> => {
    const entitiesToPersist = []
    let chat: Chat
    if (!chatId) {
        chat = DI.em.create(Chat, {
            uuid: randomUUID(),
            project: project,
            created_at: new Date(),
        })
        entitiesToPersist.push(chat)
    } else {
        chat = await DI.em.findOneOrFail(Chat, { uuid: chatId })
    }

    const timestamp = Date.now()
    const userMessageEntity = DI.em.create(ChatMessage, {
        uuid: randomUUID(),
        project: project,
        chat: chat,
        content: userMessage,
        sent_by: 'user',
        sent_at: new Date(timestamp),
    })
    entitiesToPersist.push(userMessageEntity)

    const modelMessageEntity = DI.em.create(ChatMessage, {
        uuid: randomUUID(),
        project: project,
        chat: chat,
        content: modelMessage,
        sent_by: 'model',
        sent_at: new Date(timestamp + 1), // ensure we keep an ordering of messages
    })
    entitiesToPersist.push(modelMessageEntity)

    await DI.em.persistAndFlush(entitiesToPersist)
}
