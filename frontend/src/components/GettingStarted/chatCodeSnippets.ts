import { domain } from '@/lib/api'
import { isSelfHostedDeploy } from '@/config'

const baseUrlSnippetSingleQuotes = isSelfHostedDeploy ? `, '${domain}'` : ``
const baseUrlSnippetDoubleQuotes = isSelfHostedDeploy ? `, "${domain}"` : ``

export const curlChatSnippet = `curl -X POST '${domain}/api/v1/chat/' \\
  -H 'Authorization: Bearer {apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "{query}",
    "stream": false
  }'
`

export const nodejsChatSnippet = `const { Skald } = require('@skald-labs/skald-node');

const skald = new Skald('{apiKey}'${baseUrlSnippetSingleQuotes});

const stream = skald.streamedChat({
  query: '{query}'
});

for await (const event of stream) {
  if (event.type === 'token') {
    process.stdout.write(event.content);
  }
}`

export const pythonChatSnippet = `from skald_sdk import Skald

skald = Skald('{apiKey}'${baseUrlSnippetSingleQuotes});

stream = skald.streamed_chat({
    'query': '{query}'
})

async for event in stream:
    if event['type'] == 'token':
        print(event['content'], end='')`

export const phpChatSnippet = `<?php

require 'vendor/autoload.php';

use Skald\\Skald;

$skald = new Skald('{apiKey}'${baseUrlSnippetSingleQuotes});

$stream = $skald->streamedChat([
    'query' => '{query}'
]);

foreach ($stream as $event) {
    if ($event->type === 'token') {
        echo $event->content;
    }
}`

export const rubyChatSnippet = `require 'skald'

skald = Skald.new('{apiKey}'${baseUrlSnippetSingleQuotes});

skald.streamed_chat(query: '{query}') do |event|
  if event[:type] == 'token'
    print event[:content]
  end
end`

export const goChatSnippet = `package main

import (
    "context"
    "fmt"
    "github.com/skald-org/skald-go"
)

func main() {
    client := skald.NewClient("{apiKey}"${baseUrlSnippetDoubleQuotes});

    stream := client.StreamedChat(context.Background(), skald.ChatRequest{
        Query: "{query}",
    })

    for event := range stream {
        if event.Type == "token" {
            fmt.Print(event.Content)
        }
    }
}`

export const dotnetChatSnippet = `using Skald;

var client = new SkaldClient("{apiKey}"${baseUrlSnippetDoubleQuotes});

var result = await client.ChatAsync(new ChatRequest
{
    Query = "{query}"
});

Console.WriteLine(result.Response);`
