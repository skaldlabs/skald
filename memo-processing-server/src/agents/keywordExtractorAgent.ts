import { z } from 'zod'
import { LLMService } from '../services/llm'

// Output schema for the keyword extractor agent
const KeywordsOutputSchema = z.object({
    keywords: z.array(z.string()).describe('List of relevant keywords that describe the content of the text chunk'),
})

export type KeywordsOutput = z.infer<typeof KeywordsOutputSchema>

const KEYWORDS_AGENT_INSTRUCTIONS = `
You're an expert assistant that extracts keywords from a chunk of text.
Given a chunk of text, you will extract the most relevant keywords that describe the content of the chunk.
`

/**
 * Creates a keyword extractor agent that extracts relevant keywords from text chunks
 * @returns An agent that can extract keywords from text content
 */
export function createKeywordExtractorAgent() {
    const llm = LLMService.getLLM(0)

    const structuredLlm = llm.withStructuredOutput(KeywordsOutputSchema, {
        name: 'KeywordExtractorAgent',
    })

    return {
        name: 'Keyword Extractor Agent',
        /**
         * Extract keywords from a text chunk
         * @param textChunk - The text chunk to extract keywords from
         * @returns Promise resolving to the extracted keywords
         */
        async extractKeywords(textChunk: string): Promise<KeywordsOutput> {
            const prompt = KEYWORDS_AGENT_INSTRUCTIONS + '\n\n' + `Text chunk:\n${textChunk}`

            const result = await structuredLlm.invoke([
                {
                    role: 'user',
                    content: prompt,
                },
            ])

            return result as KeywordsOutput
        },
    }
}

export const keywordExtractorAgent = createKeywordExtractorAgent()
