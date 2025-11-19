import express, { Request, Response } from 'express'
import {
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    GROQ_API_KEY,
    LOCAL_LLM_BASE_URL,
    OPENAI_MODEL,
    ANTHROPIC_MODEL,
    GROQ_MODEL,
    LOCAL_LLM_MODEL,
} from '@/settings'

interface LLMProvider {
    provider: 'openai' | 'anthropic' | 'groq' | 'local'
    label: string
    model: string
}

export const AVAILABLE_LLM_PROVIDERS: LLMProvider[] = []
if (OPENAI_API_KEY) {
    AVAILABLE_LLM_PROVIDERS.push({ provider: 'openai', label: 'OpenAI', model: OPENAI_MODEL })
}
if (ANTHROPIC_API_KEY) {
    AVAILABLE_LLM_PROVIDERS.push({ provider: 'anthropic', label: 'Anthropic', model: ANTHROPIC_MODEL })
}
if (GROQ_API_KEY) {
    AVAILABLE_LLM_PROVIDERS.push({ provider: 'groq', label: 'Groq', model: GROQ_MODEL })
}
if (LOCAL_LLM_BASE_URL) {
    AVAILABLE_LLM_PROVIDERS.push({ provider: 'local', label: 'Local', model: LOCAL_LLM_MODEL })
}

export const getAvailableLLMProviders = async (req: Request, res: Response) => {
    return res.status(200).json({
        providers: AVAILABLE_LLM_PROVIDERS,
    })
}

export const configRouter = express.Router()
configRouter.get('/llm-providers', getAvailableLLMProviders)
