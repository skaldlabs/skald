import express, { Request, Response } from 'express'
import { logger } from '@/lib/logger'
import { EXAMPLE_MEMO_SYSTEM_PROMPT, getExampleMemoUserPrompt, getExampleMemoFallback } from '@/lib/prompts'
import * as Sentry from '@sentry/node'

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

export const onboardingRouter = express.Router({ mergeParams: true })
onboardingRouter.get('/generate-example-memo', generateExampleMemo)
