# Memo Processing Agents

This directory contains LangChain-based agents for processing memos.

## Memo Tags Agent

The Memo Tags Agent extracts relevant tags from memo content to help with categorization and search.

### Features

- **Structured Output**: Uses Zod schemas to ensure type-safe, structured responses
- **Existing Tag Reuse**: Can be provided with existing tags to encourage consistency
- **GPT-4 Mini**: Uses `gpt-4o-mini` for efficient and accurate tag extraction

### Usage

```typescript
import { memoTagsAgent } from "./agents";

// Basic usage
const result = await memoTagsAgent.extractTags("Your memo content here");
console.log(result.tags); // ['tag1', 'tag2', 'tag3']

// With existing tags for consistency
const existingTags = ['react', 'typescript', 'documentation'];
const result = await memoTagsAgent.extractTags(
  "Your memo content here",
  existingTags
);
```

### Architecture

The agent is implemented using:
- **LangChain's ChatOpenAI**: For LLM integration
- **Structured Output**: Using `.withStructuredOutput()` for type-safe responses
- **Zod Schemas**: For runtime validation and TypeScript type inference

Unlike the React Agent pattern (which uses tools), this agent uses structured output since it only needs to analyze text and return formatted data.

### Comparison with Python Implementation

The TypeScript implementation mirrors the Python version:

**Python (Original)**:
```python
from agents import Agent, ModelSettings
from pydantic import BaseModel

class MemoTagsAgentOutput(BaseModel):
    tags: list[str]

memo_tags_agent = Agent(
    name="Memo Tags Agent",
    instructions=MEMO_TAGS_AGENT_INSTRUCTIONS,
    model="gpt-5-nano",
    output_type=MemoTagsAgentOutput,
)
```

**TypeScript (Port)**:
```typescript
const MemoTagsOutputSchema = z.object({
  tags: z.array(z.string()),
});

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
const structuredLlm = llm.withStructuredOutput(MemoTagsOutputSchema);
```

Both implementations:
- Define a structured output schema (Pydantic BaseModel vs Zod)
- Use the same instructions
- Return typed/validated results
- Use a small, efficient model (gpt-5-nano/gpt-4o-mini)

## Memo Summary Agent

The Memo Summary Agent generates concise summaries of memo content, with special handling for structured documents like Markdown.

### Features

- **Concise Summaries**: Generates summaries in a maximum of three paragraphs
- **Structured Output**: Uses Zod schemas for type-safe responses
- **Markdown Support**: Includes document outline for markdown content
- **GPT-4 Mini**: Uses `gpt-4o-mini` for high-quality summaries

### Usage

```typescript
import { memoSummaryAgent } from "./agents";

// Generate a summary
const result = await memoSummaryAgent.summarize("Your memo content here...");
console.log(result.summary);
```

### Comparison with Python Implementation

**Python (Original)**:
```python
class DocumentSummaryAgentOutput(BaseModel):
    summary: str

memo_summary_agent = Agent(
    name="Memo Summary Agent",
    instructions=MEMO_SUMMARY_AGENT_INSTRUCTIONS,
    model="gpt-5-nano",
    output_type=DocumentSummaryAgentOutput,
)
```

**TypeScript (Port)**:
```typescript
const MemoSummaryOutputSchema = z.object({
  summary: z.string(),
});

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
const structuredLlm = llm.withStructuredOutput(MemoSummaryOutputSchema);
```

## Keyword Extractor Agent

The Keyword Extractor Agent extracts relevant keywords from text chunks, useful for search indexing and content analysis.

### Features

- **Keyword Extraction**: Identifies the most relevant keywords from any text chunk
- **Structured Output**: Uses Zod schemas for type-safe responses
- **Versatile**: Works with code, documentation, meeting notes, and more
- **GPT-4 Mini**: Uses `gpt-4o-mini` for accurate keyword identification

### Usage

```typescript
import { keywordExtractorAgent } from "./agents";

// Extract keywords from a text chunk
const result = await keywordExtractorAgent.extractKeywords("Your text chunk here...");
console.log(result.keywords); // ['keyword1', 'keyword2', 'keyword3']
```

### Comparison with Python Implementation

**Python (Original)**:
```python
class KeywordsAgentOutput(BaseModel):
    keywords: list[str]

keyword_extractor_agent = Agent(
    name="Keyword Extractor Agent",
    instructions=KEYWORDS_AGENT_INSTRUCTIONS,
    model="gpt-5-nano",
    output_type=KeywordsAgentOutput,
)
```

**TypeScript (Port)**:
```typescript
const KeywordsOutputSchema = z.object({
  keywords: z.array(z.string()),
});

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
const structuredLlm = llm.withStructuredOutput(KeywordsOutputSchema);
```

## Running Examples

To run the example usage:

```bash
# Memo Tags Agent
tsx src/agents/examples/memoTagsExample.ts

# Memo Summary Agent
tsx src/agents/examples/memoSummaryExample.ts

# Keyword Extractor Agent
tsx src/agents/examples/keywordExtractorExample.ts
```

