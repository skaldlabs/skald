![Skald banner](./readme-assets/skald-banner.png)

<p align="center">
  <a href="https://docs.useskald.com/">Docs</a> - <a href="https://useskald.com">Website</a>  - <a href="https://www.loom.com/share/f9ac358792284d6a9bc9807e9f48587e">Demo video</a> - <a href="https://www.loom.com/share/236148c9e8be482f95961a19d9e455ea">Self-hosted deploy</a>
</p>

<p align="center">
    <a href="https://pypi.org/project/skald-sdk/">
        <img src="https://img.shields.io/badge/pypi-v.0.4.1-blue" alt="skald-sdk Python">
    </a>
    <a href="https://www.npmjs.com/package/@skald-labs/skald-node">
        <img src="https://img.shields.io/badge/npm-v.0.4.0-blue" alt="skald-node">
    </a>
        <a href="https://github.com/skaldlabs/skald-go">
        <img src="https://img.shields.io/badge/go-v.0.3.0-blue" alt="skald-go">
    </a>
    <a href="https://rubygems.org/gems/skald">
        <img src="https://img.shields.io/badge/gem-v.0.1.0-blue" alt="Skald Ruby">
    </a>
    <a href="https://packagist.org/packages/skald/skald-php">
        <img src="https://img.shields.io/badge/composer-v.1.0.2-blue" alt="skald/skald-php">
    </a>
    <a href="https://github.com/skaldlabs/skald-csharp">
        <img src="https://img.shields.io/badge/csharp-v.0.1.0-blue" alt="skald-csharp">
    </a>
    <a href="https://github.com/skaldlabs/skald-mcp">
        <img src="https://img.shields.io/badge/mcp-v.0.1.0-blue" alt="skald-mcp">
    </a>
    <a href="https://www.npmjs.com/package/@skald-labs/cli">
        <img src="https://img.shields.io/badge/cli-v.0.1.3-blue" alt="skald-cli">
    </a>
</p>

# Skald: Open-Source Production RAG in your infrastructure

Skald gives you a production-ready RAG in minutes through a plug-and-play API, and then let's you configure your RAG engine exactly to your needs.

Our solid defaults will work for most use cases, but you can tune every part of your RAG to better suit your needs. That means configurable vector search params, reranking, models, query rewriting, chunking (soon), and more. 

Ship, configure, and evaluate performance directly inside Skald.

<a href="https://join.slack.com/t/skaldcommunity/shared_invite/zt-3he986lub-UWKTZneOAUeTFa4LDXpFEg">
    <img height='40' src="/readme-assets/join-slack.svg" alt="join-slack">
</a>

## [Node SDK](https://github.com/skaldlabs/skald-node) example

```js
import { Skald } from '@skald-labs/skald-node';

const skald = new Skald('your-api-key-here');

await skald.createMemo({
  title: 'Meeting Notes',
  content: 'Full content of the memo...'
});

const chatRes = await skald.chat({
  query: 'What were the main points discussed in the Q1 meeting?',
  rag_config: { reranking: { enabled: true } }
});

console.log(chatRes.response);
```

<small>[Python](https://docs.useskald.com/docs/sdks/python#usage) - [Ruby](https://docs.useskald.com/docs/sdks/ruby#usage) - [Go](https://docs.useskald.com/docs/sdks/go#usage) - [PHP](https://docs.useskald.com/docs/sdks/php#quick-start) - [C#](https://github.com/skaldlabs/skald-csharp) - [MCP](https://docs.useskald.com/docs/sdks/mcp) - [CLI](https://docs.useskald.com/docs/sdks/cli)</small>

## ⚡ Try it

```sh
git clone https://github.com/skaldlabs/skald
cd skald
echo "OPENAI_API_KEY=<your_key>" > .env
docker-compose up
```

For a production self-hosted deploy, check out our [self-hosting docs](https://docs.useskald.com/docs/self-host/intro).

<details>
<summary>
<b>Running Skald without <u>any</u> third-party services</b>
</summary>
<br>

You can deploy Skald without **any** third-party dependencies (including OpenAI), but that will require hosting your own LLM inference server and using a local embeddings service (we've provided one for you in the `local` docker compose profile). This is advanced usage and you should check out our [docs](https://docs.useskald.com) for more details. You can also ask us questions on [Slack](https://join.slack.com/t/skaldcommunity/shared_invite/zt-3he986lub-UWKTZneOAUeTFa4LDXpFEg).

</details>

## ✨ Features:

* **Chat:** Chat with your knowledge in Skald with just one API call
* **Search:** Use semantic search to find relevant context based on user queries
* **Turnkey configuration:** Get started in minutes with great defaults and then configure your RAG engine exactly how you want it.
* **Evaluate:** Evaluate the performance of your custom RAG engine with our built-in evaluation tools.
* **Powerful filtering:** Speed up and improve responses by filtering the accessible knowledge in every query.
* **Amazing DX, no bullsh*t:** Implement in minutes with SDKs for every major language. Don't see yours? Open [an issue](https://github.com/skaldlabs/skald/issues/new) and we'll build it!
* **Truly open-source:** Our open source version is fully-featured, easy to deploy, and can even run with [no third-party dependencies](https://docs.useskald.com/docs/self-host/full-local).


## 🚀 Get started

- [Cloud](https://useskald.com): free tier with no credit card required
- [Self-hosted](https://docs.useskald.com/docs/self-host/intro): get a fully-featured production deploy with SSL live in less than an hour

## 🗒️ License

[MIT](https://github.com/skaldlabs/skald/blob/main/LICENSE) 🤸

## 🤝 Contributing

We'd be glad to have your contributions! See [CONTRIBUTING.md](/CONTRIBUTING.md) for instructions on how to run Skald locally and how to contribute.

Feel free to join our [Slack Community](https://join.slack.com/t/skaldcommunity/shared_invite/zt-3he986lub-UWKTZneOAUeTFa4LDXpFEg)

## ❤️ Contributors

List of people who have contributed to any of our repos.

<p>
    <a href="https://github.com/yakkomajuri"><img src="https://github.com/yakkomajuri.png" width="60px" alt="pedrique"/></a>
    <a href="https://github.com/pedrique"><img src="https://github.com/pedrique.png" width="60px" alt="pedrique"/></a>
    <a href="https://github.com/gustavocidornelas"><img src="https://github.com/gustavocidornelas.png" width="60px" alt="gustavocidornelas"/></a>
    <a href="https://github.com/viniciusgabrielfo"><img src="https://github.com/viniciusgabrielfo.png" width="60px" alt="viniciusgabrielfo"/></a> 
    <a href="https://github.com/Kastango"><img src="https://github.com/Kastango.png" width="60px" alt="Kastango"/></a> 
    <a href="https://github.com/jonchurch"><img src="https://github.com/jonchurch.png" width="60px" alt="jonchurch"/></a> 
    <a href="https://github.com/estebandalelr"><img src="https://github.com/estebandalelr.png" width="60px" alt="estebandalelr"/></a> 
    <a href="https://github.com/drainpixie"><img src="https://github.com/drainpixie.png" width="60px" alt="drainpixie"/></a> 
    <a href="https://github.com/yeasin2002"><img src="https://github.com/yeasin2002.png" width="60px" alt="yeasin2002"/></a>
    <a href="https://github.com/p-tirth"><img src="https://github.com/p-tirth.png" width="60px" alt="p-tirth"/></a>
</p>
