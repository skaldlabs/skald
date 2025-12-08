import { Request, Response } from 'express'
import { streamChatAgent } from '@mit/agents/chatAgent/chatAgent'
import { IS_DEVELOPMENT } from '@mit/settings'
import { logger } from '@mit/lib/logger'
import { createChatMessagePair } from '@mit/lib/chatUtils'
import { ragGraph } from '@mit/agents/chatAgent/ragGraph'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { DI } from '@mit/di'
import { LLM_PROVIDER } from '@mit/settings'

export const checkAvailability = async (req: Request, res: Response) => {
    const slug = req.params.slug

    if (!slug) {
        return res.status(400).json({ error: 'Slug is required' })
    }

    const project = await DI.projects.findOne({ chat_ui_slug: slug })

    if (!project) {
        return res.status(200).json({ available: false })
    }

    const available = project.chat_ui_enabled === true

    return res.status(200).json({ available })
}

export const chat = async (req: Request, res: Response) => {
    const query = req.body.query

    // TODO: double check this in a public context
    const chatId = req.body.chat_id
    const clientSystemPrompt = req.body.system_prompt || null
    const projectSlug = req.params.slug

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    const project = await DI.projects.findOne({ chat_ui_slug: projectSlug })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }
    if (!project.chat_ui_enabled) {
        return res.status(403).json({ error: 'Forbidden' })
    }

    const ragResultState = await ragGraph.invoke({
        query,
        project,
        chatId,
        clientSystemPrompt,
        ragConfig: project.chat_ui_rag_config ?? undefined,
    })

    const { query: finalQuery, contextStr, prompt, rerankedResults } = ragResultState

    try {
        const fullResponse = await _generateStreamingResponse({
            res,
            query: finalQuery,
            contextStr: contextStr || '',
            prompt,
            rerankResults: rerankedResults || [],
            enableReferences: project.chat_ui_rag_config?.references.enabled ?? false,
            llmProvider: project.chat_ui_rag_config?.llmProvider || LLM_PROVIDER,
        })
        const finalChatId = await createChatMessagePair(project, query, fullResponse, chatId, clientSystemPrompt)
        res.write(`data: ${JSON.stringify({ type: 'done', chat_id: finalChatId })}\n\n`)
        res.end()
    } catch (error) {
        logger.error({ err: error }, 'Chat agent error')
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
        logger.error({ err: error }, 'Streaming chat agent error')
        const errorMsg =
            IS_DEVELOPMENT && error instanceof Error ? `${error.message}\n${error.stack}` : 'An error occurred'
        const errorData = JSON.stringify({ type: 'error', content: errorMsg })
        res.write(`data: ${errorData}\n\n`)
    }
    return fullResponse
}
