import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { z } from 'zod'
import { LLMService } from '../../services/llm'

import { KNOWLEDGE_BASE_UPDATE_AGENT_INSTRUCTIONS } from './prompts'
import {
    getMemoTitlesByTagTool,
    getMemoMetadataTool,
    getMemoContentTool,
    keywordSearchTool,
    summaryVectorSearchTool,
    vectorSearchTool,
    createUpdateActionTool,
    deleteActionTool,
    createInsertActionTool,
} from './tools'
import { FetchMemoResult } from '../../db/memo'
// Output schemas
const KnowledgeBaseUpdateActionSchema = z.object({
    action: z.enum(['INSERT', 'DELETE', 'UPDATE']).describe('The action to perform on the knowledge base'),
    memo_uuid: z.string().nullable().describe('The UUID of the memo to update or delete (null for INSERT)'),
    reason: z.string().describe('A short and concise reason for this action'),
    error: z.string().nullable().describe('The error message if performing an action failed'),
})

const KnowledgeBaseUpdateAgentOutputSchema = z.object({
    actions: z.array(KnowledgeBaseUpdateActionSchema).describe('List of actions to perform on the knowledge base'),
})

export type KnowledgeBaseUpdateAction = z.infer<typeof KnowledgeBaseUpdateActionSchema>
export type KnowledgeBaseUpdateAgentOutput = z.infer<typeof KnowledgeBaseUpdateAgentOutputSchema>

// TODO: run the entire agent in a transaction?
export function createKnowledgeBaseUpdateAgent(memo: FetchMemoResult) {
    const llm = LLMService.getLLM(0)

    const agent = createReactAgent({
        llm,
        tools: [
            getMemoTitlesByTagTool,
            getMemoMetadataTool,
            getMemoContentTool,
            keywordSearchTool,
            summaryVectorSearchTool,
            vectorSearchTool,
            createInsertActionTool(memo),
            deleteActionTool,
            createUpdateActionTool(memo),
        ],
    })

    return {
        name: 'Knowledge Base Update Agent',
        /**
         * Determine necessary actions to keep the knowledge base up to date
         * @param newMemoContent - The content of the new memo being added
         * @param newMemoMetadata - Metadata about the new memo (title, tags, summary, etc.)
         * @returns Promise resolving to the list of actions to perform
         */
        async determineActions(
            memoUuid: string,
            content: string,
            title: string
        ): Promise<KnowledgeBaseUpdateAgentOutput> {
            const prompt = `
            Memo uuid: ${memoUuid}\n\n
            Memo title: ${title}
            ----------------------------------\n\n
            Memo content: 
            
            ${content}
            `
            const result = await agent.invoke({
                messages: [
                    { role: 'system', content: KNOWLEDGE_BASE_UPDATE_AGENT_INSTRUCTIONS },
                    { role: 'user', content: prompt },
                ],
            })

            // Extract the final response from the agent
            const lastMessage = result.messages[result.messages.length - 1]

            // If the agent returned a response, parse it with structured output
            if (lastMessage.content) {
                try {
                    // Use structured output to extract the actions from the response
                    const structuredLlm = llm.withStructuredOutput(KnowledgeBaseUpdateAgentOutputSchema)
                    const structuredResult = await structuredLlm.invoke([
                        {
                            role: 'user',
                            content: `Extract the actions from this response and format them as JSON: ${lastMessage.content}`,
                        },
                    ])
                    return structuredResult as KnowledgeBaseUpdateAgentOutput
                } catch (error) {
                    console.error('Error parsing structured output:', error)
                    // If parsing fails, return empty actions
                    return { actions: [] }
                }
            }

            return { actions: [] }
        },

        // Expose the raw agent for advanced usage
        agent,
    }
}
