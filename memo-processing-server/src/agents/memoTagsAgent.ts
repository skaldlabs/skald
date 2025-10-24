import { z } from 'zod'
import { LLMService } from '../services/llm'

// Output schema for the memo tags agent
const MemoTagsOutputSchema = z.object({
    tags: z.array(z.string()).describe('List of relevant tags that describe the content of the memo'),
})

export type MemoTagsOutput = z.infer<typeof MemoTagsOutputSchema>

const MEMO_TAGS_AGENT_INSTRUCTIONS = `
You're an expert assistant that extracts tags from a memo. Given a memo, extract the most relevant tags that describe the content of the memo.
These tags will be used to categorize the memo and make it easier to find later. 
You may also be given a list of tags that are already used to describe memos in the knowledge base and you should reuse them if possible rather than making up new ones.
`

/**
 * Creates a memo tags agent that extracts relevant tags from a memo
 * @returns An agent that can extract tags from memo content
 */
export function createMemoTagsAgent() {
    const llm = LLMService.getLLM()

    const structuredLlm = llm.withStructuredOutput(MemoTagsOutputSchema, {
        name: 'MemoTagsAgent',
    })

    return {
        name: 'Memo Tags Agent',
        /**
         * Extract tags from a memo
         * @param memoContent - The content of the memo
         * @param existingTags - Optional list of existing tags to reuse
         * @returns Promise resolving to the extracted tags
         */
        async extractTags(memoContent: string, existingTags?: string[]): Promise<MemoTagsOutput> {
            let prompt = MEMO_TAGS_AGENT_INSTRUCTIONS + '\n\n'

            if (existingTags && existingTags.length > 0) {
                prompt += `Existing tags in the knowledge base: ${existingTags.join(', ')}\n\n`
            }

            prompt += `Memo content:\n${memoContent}`

            const result = await structuredLlm.invoke([
                {
                    role: 'user',
                    content: prompt,
                },
            ])

            return result as MemoTagsOutput
        },
    }
}

export const memoTagsAgent = createMemoTagsAgent()
