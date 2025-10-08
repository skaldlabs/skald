
from agents import Agent, ModelSettings
from pydantic import BaseModel


class KeywordsAgentOutput(BaseModel):
    keywords: list[str]


KEYWORDS_AGENT_INSTRUCTIONS = """
You're an expert assistant that extracts keywords from a chunk of text.
Given a chunk of text, you will extract the most relevant keywords that describe the content of the chunk.
"""

keyword_extractor_agent = Agent(
    name="Keyword Extractor Agent",
    instructions=KEYWORDS_AGENT_INSTRUCTIONS,
    model="gpt-5-nano",
    output_type=KeywordsAgentOutput,
)