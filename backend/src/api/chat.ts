import express, { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { IS_CLOUD, IS_DEVELOPMENT } from '@/settings'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { createChatMessagePair } from '@/lib/chatUtils'
import { CachedQueries } from '@/queries/cachedQueries'
import { DI } from '@/di'
import { ragGraph } from '@/agents/chatAgent/ragGraph'
import { parseRagConfig } from '@/lib/ragUtils'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { Project } from '@/entities/Project'
import { chatRateLimiter } from '@/middleware/rateLimitMiddleware'
import { trackChatUsage } from '@/middleware/trackChatUsageMiddleware'
import { posthogCapture } from '@/lib/posthogUtils'

export const chat = async (req: Request, res: Response) => {
    const query = req.body.query
    const stream = req.body.stream || false
    const filters = req.body.filters || []
    const chatId = req.body.chat_id
    const clientSystemPrompt = req.body.system_prompt || null
    const ragConfig = req.body.rag_config || {}

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    if (!Array.isArray(filters)) {
        return res.status(400).json({ error: 'Filters must be a list' })
    }
    const { parsedRagConfig, error } = parseRagConfig(ragConfig)
    if (error || !parsedRagConfig) {
        return res.status(400).json({ error: error || 'Error parsing rag_config' })
    }

    const project = req.context?.requestUser?.project
    if (!project) {
        // we should never get here, but do this for type safety and extra security
        return res.status(404).json({ error: 'Project not found' })
    }

    if (IS_CLOUD) {
        const isOrgOnFreePlan = await CachedQueries.isOrganizationOnFreePlan(DI.em, project.organization.uuid)
        if (isOrgOnFreePlan) {
            const usage = await CachedQueries.getOrganizationUsage(DI.em, project.organization.uuid)
            if (usage.chatQueries >= 100) {
                return res.status(403).json({
                    error: "You've reached your plan limit of 100 chat queries. Upgrade your plan to continue using chat.",
                })
            }
            if (usage.memoWrites > 1000) {
                return res.status(403).json({
                    error: "You've reached your plan limit of 1000 memo writes. Upgrade your plan to continue chat.",
                })
            }
        } else {
            const exceeded = await CachedQueries.isBillingLimitExceeded(DI.em, project.organization.uuid)
            if (exceeded) {
                return res.status(403).json({
                    error: "You've reached your billing limit. Increase your billing limit in settings to continue.",
                })
            }
        }
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

    const ragResultState = await ragGraph.invoke({
        query,
        project,
        chatId,
        filters,
        clientSystemPrompt,
        ragConfig: parsedRagConfig,
    })

    const { query: finalQuery, contextStr, prompt, rerankedResults } = ragResultState

    posthogCapture({
        event: 'chat_api_call',
        distinctId: req.context?.requestUser?.userInstance?.email || `project:${project.uuid}`,
        groups: {
            organization: project.organization.uuid,
        },
        properties: {
            query: query,
            filters: filters,
            ragConfig: parsedRagConfig,
        },
    })

    try {
        if (stream) {
            const fullResponse = await _generateStreamingResponse({
                res,
                query: finalQuery,
                contextStr: contextStr || '',
                prompt,
                rerankResults: rerankedResults || [],
                enableReferences: parsedRagConfig.references.enabled,
                llmProvider: parsedRagConfig.llmProvider,
            })
            const finalChatId = await createChatMessagePair(project, query, fullResponse, chatId, clientSystemPrompt)
            res.write(`data: ${JSON.stringify({ type: 'done', chat_id: finalChatId })}\n\n`)
            res.end()
        } else {
            // non-streaming response - compose full response from stream
            let fullResponse = ''
            let references: Record<number, { memo_uuid: string; memo_title: string }> | undefined

            for await (const chunk of streamChatAgent({
                query: finalQuery,
                prompt,
                contextStr: contextStr || '',
                rerankResults: rerankedResults || [],
                enableReferences: parsedRagConfig.references.enabled,
                llmProvider: parsedRagConfig.llmProvider,
            })) {
                if (chunk.type === 'token') {
                    fullResponse += chunk.content || ''
                } else if (chunk.type === 'references' && chunk.content) {
                    references = JSON.parse(chunk.content)
                }
            }

            const finalChatId = await createChatMessagePair(project, query, fullResponse, chatId, clientSystemPrompt)

            const response: any = {
                ok: true,
                chat_id: finalChatId,
                response: fullResponse,
                intermediate_steps: [],
            }

            if (references) {
                response.references = references
            }

            return res.status(200).json(response)
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

interface RerankResult {
    memo_uuid?: string
    memo_title?: string
}

export const _generateStreamingResponse = async ({
    res,
    query,
    prompt,
    contextStr,
    rerankResults,
    enableReferences,
    llmProvider,
}: {
    res: Response
    query: string
    prompt: ChatPromptTemplate
    contextStr: string
    rerankResults: RerankResult[]
    enableReferences: boolean
    llmProvider: 'openai' | 'anthropic' | 'local' | 'groq' | 'gemini'
}): Promise<string> => {
    _setStreamingResponseHeaders(res)

    // establish connection
    res.write(': ping\n\n')

    console.log('llmProvider', llmProvider)

    let fullResponse = ''
    try {
        for await (const chunk of streamChatAgent({
            query,
            prompt,
            contextStr,
            rerankResults,
            enableReferences,
            llmProvider,
        })) {
            // format as Server-Sent Event
            const data = JSON.stringify(chunk)
            res.write(`data: ${data}\n\n`)

            // Only accumulate token content, not references or other event types
            if (chunk.type === 'token') {
                fullResponse += chunk.content || ''
            }
        }
    } catch (error) {
        Sentry.captureException(error)
        logger.error({ err: error }, 'Streaming chat agent error')
        const errorMsg =
            IS_DEVELOPMENT && error instanceof Error ? `${error.message}\n${error.stack}` : 'An error occurred'
        const errorData = JSON.stringify({ type: 'error', content: errorMsg })
        res.write(`data: ${errorData}\n\n`)
    }
    return fullResponse
}

export const listChats = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project

    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.page_size as string) || 20
    const maxPageSize = 100

    if (pageSize > maxPageSize) {
        return res.status(400).json({ error: `page_size must be less than or equal to ${maxPageSize}` })
    }

    if (page < 1) {
        return res.status(400).json({ error: 'page must be greater than or equal to 1' })
    }

    const offset = (page - 1) * pageSize

    const [chats, totalCount] = await DI.chats.findAndCount(
        { project },
        {
            orderBy: { created_at: 'DESC' },
            limit: pageSize,
            offset: offset,
        }
    )

    // Get all messages for these chats
    const chatUuids = chats.map((chat) => chat.uuid)
    const allMessages = await DI.chatMessages.find(
        {
            chat: { $in: chatUuids },
        },
        {
            orderBy: { sent_at: 'ASC' },
        }
    )

    // Group messages by chat and extract relevant data
    const chatDataMap = new Map<
        string,
        {
            firstUserMessage: string | null
            messageCount: number
            lastMessageAt: Date | null
        }
    >()

    for (const message of allMessages) {
        const chatId = message.chat.uuid
        const chatData = chatDataMap.get(chatId) || {
            firstUserMessage: null,
            messageCount: 0,
            lastMessageAt: null,
        }

        chatData.messageCount++

        if (message.sent_by === 'user' && !chatData.firstUserMessage) {
            chatData.firstUserMessage = message.content
        }

        if (!chatData.lastMessageAt || message.sent_at > chatData.lastMessageAt) {
            chatData.lastMessageAt = message.sent_at
        }

        chatDataMap.set(chatId, chatData)
    }

    const results = chats.map((chat) => {
        const chatData = chatDataMap.get(chat.uuid) || {
            firstUserMessage: null,
            messageCount: 0,
            lastMessageAt: null,
        }

        return {
            uuid: chat.uuid,
            created_at: chat.created_at,
            title: chatData.firstUserMessage || 'Untitled Chat',
            message_count: chatData.messageCount,
            last_message_at: chatData.lastMessageAt || chat.created_at,
        }
    })

    return res.status(200).json({
        results,
        count: totalCount,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(totalCount / pageSize),
    })
}

export const getChat = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project
    const { id } = req.params

    const chat = await DI.chats.findOne({ uuid: id, project })

    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' })
    }

    // Get all messages for this chat
    const messages = await DI.chatMessages.find(
        { chat },
        {
            orderBy: { sent_at: 'ASC' },
        }
    )

    const chatMessages = messages.map((message) => ({
        uuid: message.uuid,
        content: message.content,
        sent_by: message.sent_by,
        sent_at: message.sent_at,
        client_system_prompt: message.client_system_prompt,
    }))

    return res.status(200).json({
        uuid: chat.uuid,
        created_at: chat.created_at,
        messages: chatMessages,
    })
}

export const chatRouter = express.Router({ mergeParams: true })
chatRouter.get('/', listChats)
chatRouter.get('/:id', getChat)
chatRouter.post('/', [chatRateLimiter, trackChatUsage()], chat)
