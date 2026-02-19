import express, { Request, Response } from 'express'
import {
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    GROQ_API_KEY,
    LOCAL_LLM_BASE_URL,
    LOCAL_LLM_MODEL,
    GEMINI_API_KEY,
    BEDROCK_AWS_ACCESS_KEY_ID,
    BEDROCK_ENABLED,
} from '@/settings'
import { DEFAULT_LLM_MODELS } from '@/llmModels'

interface LLMProvider {
    provider: 'openai' | 'anthropic' | 'groq' | 'local' | 'gemini'
    label: string
    model: string
}

export const AVAILABLE_LLM_PROVIDERS: LLMProvider[] = []
if (OPENAI_API_KEY) {
    AVAILABLE_LLM_PROVIDERS.push({
        provider: 'openai',
        label: 'OpenAI',
        model: DEFAULT_LLM_MODELS.openai.defaultChatModel.name,
    })
}
if (ANTHROPIC_API_KEY || (BEDROCK_ENABLED && BEDROCK_AWS_ACCESS_KEY_ID)) {
    AVAILABLE_LLM_PROVIDERS.push({
        provider: 'anthropic',
        label: 'Anthropic',
        model: DEFAULT_LLM_MODELS.anthropic.defaultChatModel.name,
    })
}
if (GROQ_API_KEY) {
    AVAILABLE_LLM_PROVIDERS.push({
        provider: 'groq',
        label: 'Groq',
        model: DEFAULT_LLM_MODELS.groq.defaultChatModel.name,
    })
}
if (LOCAL_LLM_BASE_URL) {
    AVAILABLE_LLM_PROVIDERS.push({ provider: 'local', label: 'Local', model: LOCAL_LLM_MODEL })
}
if (GEMINI_API_KEY) {
    AVAILABLE_LLM_PROVIDERS.push({
        provider: 'gemini',
        label: 'Gemini',
        model: DEFAULT_LLM_MODELS.gemini.defaultChatModel.name,
    })
}

export const getAvailableLLMProviders = async (req: Request, res: Response) => {
    return res.status(200).json({
        providers: AVAILABLE_LLM_PROVIDERS,
    })
}

export const configRouter = express.Router()
configRouter.get('/llm-providers', getAvailableLLMProviders)
