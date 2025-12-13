export const SUPPORTED_LLM_MODELS = {
    openai: {
        'gpt-4o-mini': { slug: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        'gpt-5-nano': { slug: 'gpt-5-nano', name: 'GPT-5 Nano' },
    },
    anthropic: {
        'claude-haiku-4-5-20251001': { slug: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
        'claude-sonnet-4-5-20250929': { slug: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
    },
    gemini: {
        'gemini-2.5-flash': { slug: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        'gemini-2.5-pro': { slug: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    },
    groq: {
        'llama-3.1-8b-instant': { slug: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
    },
}

export const DEFAULT_LLM_MODELS = {
    openai: {
        defaultChatModel: SUPPORTED_LLM_MODELS.openai['gpt-4o-mini'],
        defaultClassificationModel: SUPPORTED_LLM_MODELS.openai['gpt-4o-mini'],
    },
    anthropic: {
        defaultChatModel: SUPPORTED_LLM_MODELS.anthropic['claude-sonnet-4-5-20250929'],
        defaultClassificationModel: SUPPORTED_LLM_MODELS.anthropic['claude-haiku-4-5-20251001'],
    },
    gemini: {
        defaultChatModel: SUPPORTED_LLM_MODELS.gemini['gemini-2.5-pro'],
        defaultClassificationModel: SUPPORTED_LLM_MODELS.gemini['gemini-2.5-flash'],
    },
    groq: {
        defaultChatModel: SUPPORTED_LLM_MODELS.groq['llama-3.1-8b-instant'],
        defaultClassificationModel: SUPPORTED_LLM_MODELS.groq['llama-3.1-8b-instant'],
    },
}
