import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Output schema for the memo summary agent
const MemoSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the memo content, maximum one paragraph"),
});

export type MemoSummaryOutput = z.infer<typeof MemoSummaryOutputSchema>;

const MEMO_SUMMARY_AGENT_INSTRUCTIONS = `
You're an expert assistant that summarizes text content. Given a text, summarize its content in at max one paragraph.
Be concise but make sure to include all the important information.
If the content follows a format like markdown, include the outline of the document at the end of your summary, covering all headings.
`;

/**
 * Creates a memo summary agent that generates concise summaries of memo content
 * @returns An agent that can summarize memo content
 */
export function createMemoSummaryAgent() {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const structuredLlm = llm.withStructuredOutput(MemoSummaryOutputSchema, {
    name: "MemoSummaryAgent",
  });

  return {
    name: "Memo Summary Agent",
    /**
     * Generate a summary of memo content
     * @param memoContent - The content of the memo to summarize
     * @returns Promise resolving to the generated summary
     */
    async summarize(memoContent: string): Promise<MemoSummaryOutput> {
      const prompt = MEMO_SUMMARY_AGENT_INSTRUCTIONS + "\n\n" + 
        `Text to summarize:\n${memoContent}`;

      const result = await structuredLlm.invoke([
        {
          role: "user",
          content: prompt,
        },
      ]);

      return result as MemoSummaryOutput;
    },
  };
}

export const memoSummaryAgent = createMemoSummaryAgent();

