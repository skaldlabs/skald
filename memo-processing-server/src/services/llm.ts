import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'

/**
 * LLM Service for creating LLM instances based on configuration
 */
export class LLMService {
    private static provider: string = process.env.LLM_PROVIDER || 'openai'

    /**
     * Get an LLM instance based on environment configuration
     * @param temperature - Temperature for the LLM (default: 0 for deterministic output)
     * @returns Configured LLM instance
     */
    static getLLM(temperature: number = 0): BaseChatModel {
        const provider = this.provider

        if (provider === 'openai') {
            return new ChatOpenAI({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                apiKey: process.env.OPENAI_API_KEY,
                temperature,
            })
        } else if (provider === 'anthropic') {
            return new ChatAnthropic({
                model: process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219',
                apiKey: process.env.ANTHROPIC_API_KEY,
                temperature,
            })
        } else if (provider === 'local') {
            // Local LLM with OpenAI-compatible API
            // Works with: Ollama, LM Studio, vLLM, LocalAI, etc.
            return new ChatOpenAI({
                model: process.env.LOCAL_LLM_MODEL || 'llama-3.1-8b-instruct',
                configuration: {
                    baseURL: process.env.LOCAL_LLM_BASE_URL,
                },
                apiKey: process.env.LOCAL_LLM_API_KEY || 'not-needed',
                temperature,
            })
        } else {
            throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: openai, anthropic, local`)
        }
    }

    /**
     * Validate LLM configuration on startup
     * @throws Error if configuration is invalid
     */
    static validateConfig(): void {
        const provider = this.provider
        const supportedProviders = ['openai', 'anthropic', 'local']

        if (!supportedProviders.includes(provider)) {
            throw new Error(`Invalid LLM_PROVIDER: ${provider}. Supported: ${supportedProviders.join(', ')}`)
        }

        // Warn if API keys are missing in production
        if (process.env.NODE_ENV === 'production') {
            if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
                console.warn('WARNING: OPENAI_API_KEY not set in production')
            } else if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
                console.warn('WARNING: ANTHROPIC_API_KEY not set in production')
            } else if (provider === 'local' && !process.env.LOCAL_LLM_BASE_URL) {
                console.warn('WARNING: LOCAL_LLM_BASE_URL not set for local provider')
            }
        }
    }
}
