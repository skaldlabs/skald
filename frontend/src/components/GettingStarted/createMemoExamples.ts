import { domain } from '@/lib/api'

interface CreateMemoParams {
    apiKey: string
    title: string
    content: string
}

interface CreateMemoExample {
    code: string
    language: string
}

export const getCreateMemoExample = (language: string, params: CreateMemoParams): CreateMemoExample => {
    const { apiKey, title, content } = params
    const apiKeyDisplay = apiKey || 'your_api_key'

    const generators: Record<string, () => CreateMemoExample> = {
        curl: () => ({
            code: `curl -X POST '${domain}/api/v1/memo/' \\
  -H 'Authorization: Bearer ${apiKeyDisplay}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "title": "${title}",
  "content": "${content}"
}'`,
            language: 'bash',
        }),

        nodejs: () => ({
            code: `const { Skald } = require('@skald-labs/skald-node');

const skald = new Skald('${apiKeyDisplay}');

await skald.createMemo({
  title: '${title}',
  content: '${content}'
});`,
            language: 'javascript',
        }),

        python: () => ({
            code: `from skald import Skald

skald = Skald('${apiKeyDisplay}')

skald.create_memo({
    'title': '${title}',
    'content': '${content}'
})`,
            language: 'python',
        }),

        php: () => ({
            code: `<?php

require 'vendor/autoload.php';

use Skald\\Skald;
use Skald\\Types\\MemoData;

$skald = new Skald('${apiKeyDisplay}');

$memoData = new MemoData(
    title: '${title}',
    content: '${content}'
);

$skald->createMemo($memoData);`,
            language: 'php',
        }),

        ruby: () => ({
            code: `require 'skald'

skald = Skald.new('${apiKeyDisplay}')

skald.create_memo(
  title: '${title}',
  content: '${content}'
)`,
            language: 'ruby',
        }),

        go: () => ({
            code: `package main

import (
    "context"
    "github.com/skald-org/skald-go"
)

func main() {
    client := skald.NewClient("${apiKeyDisplay}")

    client.CreateMemo(context.Background(), skald.MemoData{
        Title:   "${title}",
        Content: "${content}",
    })
}`,
            language: 'go',
        }),

        cli: () => ({
            code: `# Authenticate with your API key
skald auth --api-key ${apiKeyDisplay}

# Create a memo by writing content to a file
echo "${content}" > memo.txt

# Add the memo
skald memo add --title "${title}" --file-path memo.txt`,
            language: 'bash',
        }),
    }

    const generator = generators[language]
    if (!generator) {
        return generators.curl()
    }

    return generator()
}
