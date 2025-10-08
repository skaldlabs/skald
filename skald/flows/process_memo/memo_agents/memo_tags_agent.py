
from agents import Agent, ModelSettings
from pydantic import BaseModel


class MemoTagsAgentOutput(BaseModel):
    tags: list[str]


MEMO_TAGS_AGENT_INSTRUCTIONS = """
You're an expert assistant that extracts tags from a memo. Given a memo, extract the most relevant tags that describe the content of the memo.
These tags will be used to categorize the memo and make it easier to find later. 
You may also be given a list of tags that are already used to describe memos in the knowledge base and you should reuse them if possible rather than making up new ones.
"""

memo_tags_agent = Agent(
    name="Memo Tags Agent",
    instructions=MEMO_TAGS_AGENT_INSTRUCTIONS,
    model="gpt-5-nano",

    output_type=MemoTagsAgentOutput,
)