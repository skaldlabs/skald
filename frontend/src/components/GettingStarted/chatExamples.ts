import { domain } from '@/lib/api'

interface ChatExampleParams {
    apiKey: string
    query: string
}

interface CodeExample {
    code: string
    language: string
}

export const getChatExample = (language: string, params: ChatExampleParams): CodeExample => {
    const { apiKey, query } = params
    const apiKeyDisplay = apiKey || 'your_api_key'

    const generators: Record<string, () => CodeExample> = {
        curl: () => ({
            code: `curl -X POST '${domain}/api/v1/chat/' \\
  -H 'Authorization: Bearer ${apiKeyDisplay}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "query": "${query}",
  "stream": true
}'`,
            language: 'bash',
        }),

        nodejs: () => ({
            code: `const { Skald } = require('@skald-labs/skald-node');

const skald = new Skald('${apiKeyDisplay}');

const stream = skald.streamedChat({
  query: '${query}'
});

for await (const event of stream) {
  if (event.type === 'token') {
    process.stdout.write(event.content);
  }
}`,
            language: 'javascript',
        }),

        python: () => ({
            code: `from skald_sdk import Skald

skald = Skald('${apiKeyDisplay}')

stream = skald.streamed_chat({
    'query': '${query}'
})

for event in stream:
    if event['type'] == 'token':
        print(event['content'], end='')`,
            language: 'python',
        }),

        php: () => ({
            code: `<?php

require 'vendor/autoload.php';

use Skald\\Skald;

$skald = new Skald('${apiKeyDisplay}');

$stream = $skald->streamedChat([
    'query' => '${query}'
]);

foreach ($stream as $event) {
    if ($event->type === 'token') {
        echo $event->content;
    }
}`,
            language: 'php',
        }),

        ruby: () => ({
            code: `require 'skald'

skald = Skald.new('${apiKeyDisplay}')

skald.streamed_chat(query: '${query}') do |event|
  if event[:type] == 'token'
    print event[:content]
  end
end`,
            language: 'ruby',
        }),

        go: () => ({
            code: `package main

import (
    "context"
    "fmt"
    "github.com/skald-org/skald-go"
)

func main() {
    client := skald.NewClient("${apiKeyDisplay}")

    stream := client.StreamedChat(context.Background(), skald.ChatRequest{
        Query: "${query}",
    })

    for event := range stream {
        if event.Type == "token" {
            fmt.Print(event.Content)
        }
    }
}`,
            language: 'go',
        }),

        cli: () => ({
            code: `# Ask a question to your knowledge base
skald chat ask "${query}"`,
            language: 'bash',
        }),
    }

    const generator = generators[language]
    if (!generator) {
        return generators.curl()
    }

    return generator()
}
