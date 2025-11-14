import { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { IS_CLOUD, IS_DEVELOPMENT, LLM_PROVIDER, SUPPORTED_LLM_PROVIDERS } from '@/settings'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { createChatMessagePair } from '@/lib/chatUtils'
import { CachedQueries } from '@/queries/cachedQueries'
import { DI } from '@/di'
import { ragGraph } from '@/agents/chatAgent/ragGraph'
import { ChatPromptTemplate } from '@langchain/core/prompts'

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

    const ragResultState = await ragGraph.invoke({
        query,
        project,
        chatId,
        filters,
        clientSystemPrompt,
        options: {
            llmProvider,
            references: {
                enabled: enableReferences,
            },
            queryRewrite: {
                enabled: false,
            },
            vectorSearch: {
                topK: 3,
                similarityThreshold: 0.5,
            },
            reranking: {
                enabled: false,
                topK: 4,
            },
        },
    })

    const { query: finalQuery, contextStr, prompt, rerankedResults } = ragResultState

    try {
        if (stream) {
            const fullResponse = await _generateStreamingResponse({
                res,
                query: finalQuery,
                contextStr: contextStr || '',
                prompt,
                rerankResults: rerankedResults || [],
                enableReferences,
                llmProvider,
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
                enableReferences,
                llmProvider,
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
    llmProvider: 'openai' | 'anthropic' | 'local' | 'groq'
}): Promise<string> => {
    _setStreamingResponseHeaders(res)

    // establish connection
    res.write(': ping\n\n')

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
        logger.error({ err: error }, 'Streaming chat agent error')
        const errorMsg =
            IS_DEVELOPMENT && error instanceof Error ? `${error.message}\n${error.stack}` : 'An error occurred'
        const errorData = JSON.stringify({ type: 'error', content: errorMsg })
        res.write(`data: ${errorData}\n\n`)
    }
    return fullResponse
}
