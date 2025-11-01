import { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { prepareContextForChatAgent } from '@/agents/chatAgent/preprocessing'
import { runChatAgent, streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { sendErrorResponse } from '@/utils/errorHandler'
import { DEBUG } from '@/settings'

export const chat = async (req: Request, res: Response) => {
    const query = req.body.query
    const stream = req.body.stream || false
    const filters = req.body.filters || []

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
            await _generateStreamingResponse(query, contextStr, res)
        } else {
            // non-streaming response
            const result = await runChatAgent(query, contextStr)

            return res.status(200).json({
                ok: true,
                response: result.output,
                intermediate_steps: result.intermediate_steps || [],
            })
        }
    } catch (error) {
        return sendErrorResponse(res, error, 500)
    }
}

export const _setStreamingResponseHeaders = (res: Response) => {
    // set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
}

export const _generateStreamingResponse = async (query: string, contextStr: string, res: Response) => {
    _setStreamingResponseHeaders(res)

    // establish connection
    res.write(': ping\n\n')

    try {
        for await (const chunk of streamChatAgent(query, contextStr)) {
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
        }
    } catch (error) {
        console.error('Streaming chat agent error:', error)
        const errorMsg = DEBUG && error instanceof Error ? `${error.message}\n${error.stack}` : 'An error occurred'
        const errorData = JSON.stringify({ type: 'error', content: errorMsg })
        res.write(`data: ${errorData}\n\n`)
    } finally {
        // send a done event
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        res.end()
    }
}
