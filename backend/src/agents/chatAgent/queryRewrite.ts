import { QUERY_REWRITE_PROMPT } from '@/agents/chatAgent/prompts'
import { logger } from '@/lib/logger'
import { LLMService } from '@/services/llmService'
import * as Sentry from '@sentry/node'

interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string
}

export const rewrite = async (query: string, conversationHistory: ConversationMessage[] = []): Promise<string> => {
    try {
        const recentHistory = conversationHistory.slice(-3)
        const contextStr =
            recentHistory.length > 0
                ? `\n\nCONVERSATION CONTEXT:\n${recentHistory
                      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                      .join('\n')}\n`
                : ''

        const userPrompt = `${contextStr}\nQuery to enhance: "${query}"`

        const llm = LLMService.getLLM({ purpose: 'classification', temperature: 0.3 })

        const response = await llm.invoke([
            { role: 'system', content: QUERY_REWRITE_PROMPT },
            { role: 'user', content: userPrompt },
        ])

        const rewrittenQuery = response.content?.toString().trim()

        if (!rewrittenQuery) {
            logger.warn({ query }, 'Query rewriting failed, returning original query')
            return query
        }

        return rewrittenQuery
    } catch (error) {
        logger.error({ err: error, query }, 'Error rewriting query')
        Sentry.captureException(error, {
            tags: { service: 'query_rewrite' },
            extra: { query },
        })
        return query
    }
}
