import { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { prepareContextForChatAgent } from '@/agents/chatAgent/preprocessing'
import { runChatAgent, streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { IS_DEVELOPMENT, LLM_PROVIDER, SUPPORTED_LLM_PROVIDERS } from '@/settings'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { getOptimizedChatHistory, createChatMessagePair } from '@/lib/chatUtils'

export const chat = async (req: Request, res: Response) => {
    const query = req.body.query
    const stream = req.body.stream || false
    const filters = req.body.filters || []
    const chatId = req.body.chat_id
    const clientSystemPrompt = req.body.system_prompt || null

    // experimental: allow the client to specify the LLM provider (not the model yet)
    // we will not document this or add this to SDKs until we're certain of the behavior we want
    // initially this is meant to support testing in the playground
    // using this feature requires that the instance have API keys for all supported providers
    const llmProvider = req.body.llm_provider || LLM_PROVIDER
    if (!SUPPORTED_LLM_PROVIDERS.includes(llmProvider)) {
        return res
            .status(400)
            .json({
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

    try {
        if (stream) {
            const fullResponse = await _generateStreamingResponse({
                query,
                contextStr,
                clientSystemPrompt,
                res,
                conversationHistory,
                llmProvider,
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
                llmProvider,
            })
            const finalChatId = await createChatMessagePair(project, query, result.output, chatId, clientSystemPrompt)

            return res.status(200).json({
                ok: true,
                chat_id: finalChatId,
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

export const _generateStreamingResponse = async ({
    query,
    contextStr,
    clientSystemPrompt = null,
    res,
    conversationHistory = [],
    llmProvider,
}: {
    query: string
    contextStr: string
    clientSystemPrompt?: string | null
    res: Response
    conversationHistory?: Array<[string, string]>
    llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
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
            llmProvider,
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
            fullResponse += chunk.content || ''
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
