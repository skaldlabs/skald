![Skald banner](./readme-assets/skald-banner.png)

<p align="center">
  <a href="https://docs.useskald.com/">Docs</a> - <a href="https://useskald.com">Website</a> 
</p>

<p align="center">
    <a href="https://pypi.org/project/skald-sdk/">
        <img src="https://img.shields.io/badge/pypi-v.0.1.0-blue" alt="skald-sdk Python">
    </a>
    <a href="https://www.npmjs.com/package/@skald-labs/skald-node">
        <img src="https://img.shields.io/badge/npm-v.0.1.3-blue" alt="skald-node">
    </a>
    <a href="https://rubygems.org/gems/skald">
        <img src="https://img.shields.io/badge/gem-v.0.1.0-blue" alt="Skald Ruby">
    </a>
    <a href="https://packagist.org/packages/skald/skald-php">
        <img src="https://img.shields.io/badge/composer-v.1.0.2-blue" alt="skald/skald-php">
    </a>
    <a href="https://github.com/skaldlabs/skald-go">
        <img src="https://img.shields.io/badge/go-v.0.1.0-blue" alt="skald-go">
    </a>
    <a href="https://github.com/skaldlabs/skald-mcp">
        <img src="https://img.shields.io/badge/mcp-v.0.1.0-blue" alt="skald-mcp">
    </a>
    <a href="https://www.npmjs.com/package/@skald-labs/cli">
        <img src="https://img.shields.io/badge/cli-v.0.1.3-blue" alt="skald-cli">
    </a>
</p>

# Skald: The API platform for building AI-native apps

With Skald you don't need to implement RAG ever again. Push context to our API, and get chat, search, document generation and more out of the box.

**[Node SDK](https://github.com/skaldlabs/skald-node) example**

```js
import { Skald } from '@skald-labs/skald-node';

const skald = new Skald('your-api-key-here');

const result = await skald.createMemo({
  title: 'Meeting Notes',
  content: 'Full content of the memo...'
});

const result = await skald.chat({
  query: 'What were the main points discussed in the Q1 meeting?'
});
```

<small>[Python](https://docs.useskald.com/docs/sdks/python#usage) - [Ruby](https://docs.useskald.com/docs/sdks/ruby#usage) - [Go](https://docs.useskald.com/docs/sdks/go#usage) - [PHP](https://docs.useskald.com/docs/sdks/php#quick-start) - [MCP](https://docs.useskald.com/docs/sdks/mcp) - [CLI](https://docs.useskald.com/docs/sdks/cli)</small>

## ⚡ Try it

```sh
git clone https://github.com/skaldlabs/skald
cd skald
OPENAI_API_KEY=<your_key> docker-compose up
```

For a production self-hosted deploy, check out our [self-hosting docs](https://docs.useskald.com/docs/self-host/intro).

<details>
<summary>
<b>Running Skald without <u>any</u> third-party services</b>
</summary>
<br>

You can deploy Skald without **any** third-party dependencies (including OpenAI), but that will require hosting your own LLM inference server and using a local embeddings service (we've provided one for you in the `local-embedding` docker compose profile). This is advanced usage and is classed as experimental, check out our [docs](https://docs.useskald.com) for more details.

</details>

## ✨ Features:

* **Chat:** Chat with your knowledge in Skald with just one API call
* **Search:** Use semantic search to find relevant context based on user queries
* **Generate:** Generate content from your knowledge like documentation and reports
* **Powerful filtering**: Speed up and improve responses by filtering the accessible knowledge in every query.
* **Amazing DX, no bullsh*t:** Implement in minutes with SDKs for every major languag. Don't see yours? open an issue and we'll build it!
* **Truly open-source:** Our open source version is fully-featured, easy to deploy and can run with **no third-party dependencies**. You heard that right, no need to configure a single env var.

## 🚀 Get started

* [Cloud](https://useskald.com): free tier with no credit card required
* [Self-hosted](https://docs.useskald.com/docs/self-host/intro): get a fully-featured production deploy with SSL live in less than an hour

## 🗒️ License

MIT 🤸

