
from agents import Agent, ModelSettings
from pydantic import BaseModel


class DocumentSummaryAgentOutput(BaseModel):
    summary: str


MEMO_SUMMARY_AGENT_INSTRUCTIONS = """
You're an expert assistant that summarizes text content. Given a text, summarize its content in at max three paragraphs.
Be concise but make sure to include all the important information.
If the content follows a format like markdown, include the outline of the document at the end of your summary, covering all headings.
"""

memo_summary_agent = Agent(
    name="Memo Summary Agent",
    instructions=MEMO_SUMMARY_AGENT_INSTRUCTIONS,
    model="gpt-5-nano",
    output_type=DocumentSummaryAgentOutput,
)