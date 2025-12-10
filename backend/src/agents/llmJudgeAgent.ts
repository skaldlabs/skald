import { z } from 'zod'
import { LLMService } from '@/services/llmService'

// Output schema for the memo summary agent
const LLMJudgeOutputSchema = z.object({
    score: z.number().describe('A score from 0-10, where 10 is the best score').min(0).max(10),
    reasoning: z.string().describe('A brief explanation of the score'),
})

export type LLMJudgeOutput = z.infer<typeof LLMJudgeOutputSchema>

const LLM_JUDGE_AGENT_INSTRUCTIONS = `
You are an expert evaluator. Your task is to compare an actual answer to an expected answer for a given question and provide a score from 0-10, where 10 is the best score.

Rules:
- If the actual answer contains the target answer but includes more context, the score should be high.
- You should judge from the question if the answer requires an exact match or a sentiment match and score accordingly.

Examples:

> Question: "What is the capital of France?"
- Actual answer: "The capital of France is Paris. Paris is known for the Eiffel Tower."
- Expected answer: "Paris"
- Score: 8
- Reasoning: The actual answer includes more irrelevant context than the expected answer, but the expected answer is still present.

> Question: "What is the capital of France?"
- Actual answer: "The capital of France is Paris."
- Expected answer: "Paris"
- Score: 10
- Reasoning: The actual answer is an exact match to the expected answer.

> Question: "What is Paris known for?"
- Actual answer: "Paris is known for the Eiffel Tower, a 330m tall metal tower in the center of the city and its boulangeries (French bakery shops), and the Louvre museum, the largest art museum in the world."
- Expected answer: "Paris is known for the Eiffel Tower, the Louvre, and its boulangeries."
- Score: 10
- Reasoning: The actual answer adds additional context that is not in the expected answer, but the expected answer is still present, and the context is relevant to the question.

> Question: "What is Paris known for?"
- Actual answer: "Paris is known for the people of the city."
- Expected answer: "Paris is known for the Eiffel Tower, the Louvre, and its boulangeries."
- Score: 0
- Reasoning: The actual answer has nothing to do with the expected answer.

> Question: "What is Paris known for?"
- Actual answer: "Paris is known for the Eiffel Tower."
- Expected answer: "Paris is known for the Eiffel Tower, the Louvre, and its boulangeries."
- Score: 5
- Reasoning: The actual answer is a partial match to the expected answer, but the expected answer is not fully covered.

> Question: "What are the office rules at our London office?"
- Actual answer: "The office rules are: 1. Don't be late 2. Treat others well 3. Act formally 4. Be involved with your team"
- Expected answer: "The office rules are: 1. Be on time 2. Be respectful 3. Be professional 4. Be a team player"
- Score: 6
- Reasoning: The actual answer is an interpretation of the expected answer, but the user does not expect an interpreation here, they expect a list of rules exactly as listed.

Respond with ONLY a JSON object in this format:
{"score": <number from 0-10>, "reasoning": "<brief explanation>"}
`

/**
 * Creates a memo summary agent that generates concise summaries of memo content
 * @returns An agent that can summarize memo content
 */
export function createLLMJudgeAgent() {
    const llm = LLMService.getLLM({ purpose: 'classification' })

    const structuredLlm = llm.withStructuredOutput(LLMJudgeOutputSchema, {
        name: 'LLMJudgeAgent',
    })

    return {
        name: 'LLM-as-a-Judge Agent',
        /**
         * Generate a summary of memo content
         * @param question - The question that was asked
         * @param actualAnswer - The actual answer from the LLM
         * @param expectedAnswer - The expected answer
         * @returns Promise resolving to the generated summary
         */
        async judge(question: string, actualAnswer: string, expectedAnswer: string): Promise<LLMJudgeOutput> {
            const prompt = `Question: ${question}\nActual answer: ${actualAnswer}\nExpected answer: ${expectedAnswer}`

            const result = await structuredLlm.invoke(
                [
                    {
                        role: 'system',
                        content: LLM_JUDGE_AGENT_INSTRUCTIONS,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                {
                    callbacks: [], // Disable LangSmith tracing
                }
            )

            return result as LLMJudgeOutput
        },
    }
}

export const llmJudgeAgent = createLLMJudgeAgent()
