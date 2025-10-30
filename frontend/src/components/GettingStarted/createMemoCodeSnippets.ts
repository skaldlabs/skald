import { domain } from '@/lib/api'
import { isSelfHostedDeploy } from '@/config'

const baseUrlSnippetSingleQuotes = isSelfHostedDeploy ? `, '${domain}'` : ``
const baseUrlSnippetDoubleQuotes = isSelfHostedDeploy ? `, "${domain}"` : ``

export const curlCreateMemoSnippet = `curl -X POST '${domain}/api/v1/memo/' \\
  -H 'Authorization: Bearer {apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "title": "{title}",
  "content": "{content}"
}'`

export const nodejsCreateMemoSnippet = `const { Skald } = require('@skald-labs/skald-node');

const skald = new Skald('{apiKey}'${baseUrlSnippetSingleQuotes});

await skald.createMemo({
  title: '{title}',
  content: '{content}'
});`

export const pythonCreateMemoSnippet = `from skald import Skald

skald = Skald('{apiKey}'${baseUrlSnippetSingleQuotes});

skald.create_memo({
    'title': '{title}',
    'content': '{content}'
})`

export const phpCreateMemoSnippet = `<?php

require 'vendor/autoload.php';

use Skald\\Skald;
use Skald\\Types\\MemoData;

$skald = new Skald('{apiKey}'${baseUrlSnippetSingleQuotes});

$memoData = new MemoData(
    title: '{title}',
    content: '{content}'
);

$skald->createMemo($memoData);`

export const rubyCreateMemoSnippet = `require 'skald'

skald = Skald.new('{apiKey}'${baseUrlSnippetSingleQuotes});

skald.create_memo(
  title: '{title}',
  content: '{content}'
)`

export const goCreateMemoSnippet = `package main

import (
    "context"
    "github.com/skald-org/skald-go"
)

func main() {
    client := skald.NewClient("{apiKey}"${baseUrlSnippetDoubleQuotes});

    client.CreateMemo(context.Background(), skald.MemoData{
        Title:   "{title}",
        Content: "{content}",
    })
}`

export const cliCreateMemoSnippet = `# Authenticate with your API key -- Currently Cloud-only
skald auth --api-key {apiKey}

# Create a memo by writing content to a file
echo "{content}" > memo.txt

# Add the memo
skald memo add --title "{title}" --file-path memo.txt`
