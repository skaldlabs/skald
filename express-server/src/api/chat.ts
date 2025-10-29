import { Request, Response } from 'express'
import { parseFilter } from '../lib/filterUtils'
import { prepareContextForChatAgent } from '../agents/chatAgent/preprocessing'
import { runChatAgent, streamChatAgent } from '../agents/chatAgent/chatAgent'
import { DI } from '../index'

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

    const memoFilters = []
    for (const filter of filters) {
        const { filter: memoFilter, error } = parseFilter(filter)
        if (memoFilter && !error) {
            memoFilters.push(memoFilter)
        } else {
            return res.status(400).json({ error: `Invalid filter: ${error}` })
        }
    }

    // TODO: Get project from auth - for now hardcode
    // You mentioned to hardcode the project for now
    // Get the first project from the database as a placeholder
    let project
    try {
        project = await DI.em.findOne('Project', {})
        if (!project) {
            return res.status(404).json({ error: 'No project found. Please create a project first.' })
        }
    } catch (error) {
        return res.status(500).json({ error: 'Failed to retrieve project' })
    }

    // Prepare context for chat agent
    let rerankedResults
    try {
        rerankedResults = await prepareContextForChatAgent(query, project as any, memoFilters)
    } catch (error) {
        console.error('Error preparing context:', error)
        return res.status(500).json({ error: `Failed to prepare context: ${error}` })
    }

    // Build context string
    let contextStr = ''
    for (let i = 0; i < rerankedResults.length; i++) {
        contextStr += `Result ${i + 1}: ${rerankedResults[i].document}\n\n`
    }

    try {
        // Check if streaming is requested
        if (stream) {
            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('X-Accel-Buffering', 'no')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

            // Send initial ping to establish connection
            res.write(': ping\n\n')

            try {
                for await (const chunk of streamChatAgent(query, contextStr)) {
                    // Handle different chunk types
                    if (chunk.content && typeof chunk.content === 'object') {
                        // Extract text from dict (Anthropic format)
                        const content = chunk.content as any
                        chunk.content = content.text || content.content || String(content)
                    } else if (chunk.content && typeof chunk.content !== 'string') {
                        chunk.content = String(chunk.content)
                    }

                    // Format as Server-Sent Event
                    const data = JSON.stringify(chunk)
                    res.write(`data: ${data}\n\n`)
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? `${error.message}\n${error.stack}` : String(error)
                const errorData = JSON.stringify({ type: 'error', content: errorMsg })
                res.write(`data: ${errorData}\n\n`)
            } finally {
                // Send a done event
                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                res.end()
            }
        } else {
            // Non-streaming response
            const result = await runChatAgent(query, contextStr)

            return res.status(200).json({
                ok: true,
                response: result.output,
                intermediate_steps: result.intermediate_steps || [],
            })
        }
    } catch (error) {
        console.error('Chat agent error:', error)
        return res.status(500).json({ error: `Agent error: ${error}` })
    }
}
