import express, { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { prepareContextForChatAgent } from '@/agents/chatAgent/preprocessing'
import { runChatAgent, streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { IS_CLOUD, IS_DEVELOPMENT, LLM_PROVIDER, SUPPORTED_LLM_PROVIDERS } from '@/settings'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { getOptimizedChatHistory, createChatMessagePair } from '@/lib/chatUtils'
import { CachedQueries } from '@/queries/cachedQueries'
import { DI } from '@/di'
import { Project } from '@/entities/Project'
import { chatRateLimiter } from '@/middleware/rateLimitMiddleware'
import { trackChatUsage } from '@/middleware/trackChatUsageMiddleware'

export const chat = async (req: Request, res: Response) => {
    const query = req.body.query
    const stream = req.body.stream || false
    const filters = req.body.filters || []
    const chatId = req.body.chat_id
    const clientSystemPrompt = req.body.system_prompt || null
    const enableReferences = req.body.enable_references || false

    // experimental: allow the client to specify the LLM provider (not the model yet)
    // we will not document this or add this to SDKs until we're certain of the behavior we want
    // initially this is meant to support testing in the playground
    // using this feature requires that the instance have API keys for all supported providers
    const llmProvider = req.body.llm_provider || LLM_PROVIDER
    if (!['openai', 'anthropic', 'groq'].includes(llmProvider)) {
        return res.status(400).json({
            error: `Invalid LLM provider: ${llmProvider}. Supported providers: ${SUPPORTED_LLM_PROVIDERS.join(', ')}`,
        })
    }

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

    if (IS_CLOUD) {
        const isOrgOnFreePlan = await CachedQueries.isOrganizationOnFreePlan(DI.em, project.organization.uuid)
        if (isOrgOnFreePlan) {
            const usage = await CachedQueries.getOrganizationUsage(DI.em, project.organization.uuid)
            if (usage.chatQueries >= 100) {
                return res.status(403).json({
                    error: "You've reached your plan limit of 100 chat queries. Upgrade your plan to continue using chat.",
                })
            }
            if (usage.memoWrites >= 1000) {
                return res.status(403).json({
                    error: "You've reached your plan limit of 1000 memo writes. Upgrade your plan to continue chat.",
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

    const conversationHistory = await getOptimizedChatHistory(chatId, project)

    const rerankedResults = await prepareContextForChatAgent(query, project, memoFilters)

    let contextStr = ''
    for (let i = 0; i < rerankedResults.length; i++) {
        contextStr += `Result ${i + 1}: ${rerankedResults[i].document}\n\n`
    }

    const chatAgentOptions = {
        llmProvider,
        enableReferences,
    }

    try {
        if (stream) {
            const fullResponse = await _generateStreamingResponse({
                query,
                contextStr,
                clientSystemPrompt,
                res,
                conversationHistory,
                rerankResults: rerankedResults,
                options: chatAgentOptions,
            })
            const finalChatId = await createChatMessagePair(project, query, fullResponse, chatId, clientSystemPrompt)
            res.write(`data: ${JSON.stringify({ type: 'done', chat_id: finalChatId })}\n\n`)
            res.end()
        } else {
            // non-streaming response
            const result = await runChatAgent({
                query,
                context: contextStr,
                clientSystemPrompt,
                conversationHistory,
                rerankResults: rerankedResults,
                options: chatAgentOptions,
            })
            const finalChatId = await createChatMessagePair(project, query, result.output, chatId, clientSystemPrompt)

            const response: any = {
                ok: true,
                chat_id: finalChatId,
                response: result.output,
                intermediate_steps: result.intermediate_steps || [],
            }

            if (result.references) {
                response.references = result.references
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
    query,
    contextStr,
    clientSystemPrompt = null,
    res,
    conversationHistory = [],
    rerankResults = [],
    options = {
        enableReferences: false,
    },
}: {
    query: string
    contextStr: string
    clientSystemPrompt?: string | null
    res: Response
    conversationHistory?: Array<[string, string]>
    rerankResults?: RerankResult[]
    options?: {
        llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
        enableReferences?: boolean
    }
}): Promise<string> => {
    _setStreamingResponseHeaders(res)

    // establish connection
    res.write(': ping\n\n')

    let fullResponse = ''
    try {
        for await (const chunk of streamChatAgent({
            query,
            context: contextStr,
            clientSystemPrompt,
            conversationHistory,
            rerankResults,
            options,
        })) {
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

            // Only accumulate token content, not references or other event types
            if (chunk.type === 'token') {
                fullResponse += chunk.content || ''
            }
        }
    } catch (error) {
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
        skald_system_prompt: message.skald_system_prompt,
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
