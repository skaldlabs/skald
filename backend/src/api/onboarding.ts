import express, { Request, Response } from 'express'
import { logger } from '@/lib/logger'
import { EXAMPLE_MEMO_SYSTEM_PROMPT, getExampleMemoUserPrompt, getExampleMemoFallback } from '@/lib/prompts'
import * as Sentry from '@sentry/node'
import { Project } from '@/entities/Project'
import { DI } from '@/di'
import { requireProjectAccess } from '@/middleware/authMiddleware'

export const generateExampleMemo = async (req: Request, res: Response) => {
    const organizationName = req.query.organization_name as string | undefined

    try {
        const { LLMService } = await import('@/services/llmService')
        const llm = LLMService.getLLM(0.8)

        const response = await llm.invoke([
            { role: 'system', content: EXAMPLE_MEMO_SYSTEM_PROMPT },
            { role: 'user', content: getExampleMemoUserPrompt(organizationName) },
        ])

        const responseText = response.content.toString()

        // Try to parse JSON from the response
        let parsed: { title: string; content: string }
        try {
            // Handle potential markdown code blocks
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText]
            const jsonStr = jsonMatch[1]?.trim() || responseText.trim()
            parsed = JSON.parse(jsonStr)
        } catch {
            // Fallback if JSON parsing fails
            logger.warn('Failed to parse LLM response as JSON, using fallback')
            parsed = getExampleMemoFallback(organizationName)
        }

        return res.status(200).json({
            title: parsed.title,
            content: parsed.content,
        })
    } catch (error) {
        logger.error({ err: error }, 'Error generating example memo')
        Sentry.captureException(error)

        // Return fallback content on error
        const fallback = getExampleMemoFallback(organizationName)
        return res.status(200).json(fallback)
    }
}

export const getSuggestions = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project
    const memoUuid = req.query.memo_uuid as string

    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    if (!memoUuid) {
        return res.status(400).json({ error: 'memo_uuid query parameter is required' })
    }

    // Fetch the memo
    const memo = await DI.memos.findOne({ uuid: memoUuid, project })

    if (!memo) {
        return res.status(404).json({ error: 'Memo not found' })
    }

    // Fetch memo content and summary
    const memoContent = await DI.memoContents.findOne({ memo })
    const memoSummary = await DI.memoSummaries.findOne({ memo })

    if (!memoContent) {
        return res.status(404).json({ error: 'Memo content not found' })
    }

    // Use summary if available, otherwise use truncated content
    const contentForPrompt = memoSummary?.summary || memoContent.content.substring(0, 1000)

    try {
        // Use a fast LLM to generate suggestions
        const { LLMService } = await import('@/services/llmService')
        const llm = LLMService.getLLM(0.7) // Higher temperature for more creative suggestions

        const systemPrompt = `You are a helpful assistant that generates relevant questions based on content.
Generate 3-5 specific, conversational questions that someone might ask to learn more about the provided content.
Make the questions natural and relevant to the content. Return only the questions, one per line, without numbering or bullets.`

        const userPrompt = `Based on this content about "${memo.title}":\n\n${contentForPrompt}\n\nGenerate 3-5 relevant questions:`

        const response = await llm.invoke([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ])

        // Parse the response into individual questions
        const suggestions = response.content
            .toString()
            .split('\n')
            .map((q: string) => q.trim())
            .filter((q: string) => q.length > 0 && !q.match(/^\d+[.)]/)) // Remove numbering if present
            .map((q: string) => q.replace(/^[-*]\s*/, '')) // Remove bullet points
            .slice(0, 5) // Limit to 5 suggestions

        return res.status(200).json({ suggestions })
    } catch (error) {
        logger.error({ err: error }, 'Error generating chat suggestions')
        Sentry.captureException(error)

        // Return fallback suggestions on error
        const fallbackSuggestions = [
            `What are the main points about ${memo.title}?`,
            'Can you explain this in more detail?',
            'What are the key takeaways?',
        ]

        return res.status(200).json({ suggestions: fallbackSuggestions })
    }
}

export const onboardingRouter = express.Router({ mergeParams: true })
onboardingRouter.get('/generate-example-memo', generateExampleMemo)
onboardingRouter.get('/suggestions', [requireProjectAccess()], getSuggestions)
