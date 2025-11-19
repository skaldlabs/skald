import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import {
    LLM_PROVIDER,
    OPENAI_MODEL,
    OPENAI_API_KEY,
    ANTHROPIC_MODEL,
    ANTHROPIC_API_KEY,
    LOCAL_LLM_MODEL,
    LOCAL_LLM_BASE_URL,
    LOCAL_LLM_API_KEY,
    GROQ_API_KEY,
    GROQ_MODEL,
} from '../settings'
/**
 * LLM Service for creating LLM instances based on configuration
 */
export class LLMService {
    private static provider: string = LLM_PROVIDER

    // TODO: we should not only allow configuring the model here but we should  also have
    // model "types" that can be used e.g. "fast", "default", "high-quality", etc. for each provider.
    /**
     * Get an LLM instance based on environment configuration
     * @param temperature - Temperature for the LLM (default: 0 for deterministic output)
     * @returns Configured LLM instance
     */
    static getLLM(
        temperature: number = 0,
        providerOverride?: 'openai' | 'anthropic' | 'local' | 'groq'
    ): BaseChatModel {
        let provider = this.provider
        if (providerOverride) {
            provider = providerOverride
        }

        if (provider === 'openai') {
            if (!OPENAI_API_KEY) {
                throw new Error('OpenAI provider is not configured. Please set OPENAI_API_KEY.')
            }
            return new ChatOpenAI({
                model: OPENAI_MODEL,
                apiKey: OPENAI_API_KEY,
                temperature,
            })
        } else if (provider === 'anthropic') {
            if (!ANTHROPIC_API_KEY) {
                throw new Error('Anthropic provider is not configured. Please set ANTHROPIC_API_KEY.')
            }
            return new ChatAnthropic({
                model: ANTHROPIC_MODEL,
                apiKey: ANTHROPIC_API_KEY,
                temperature,
            })
        } else if (provider === 'local') {
            if (!LOCAL_LLM_BASE_URL) {
                throw new Error('Local LLM provider is not configured. Please set LOCAL_LLM_BASE_URL.')
            }
            // Local LLM with OpenAI-compatible API
            // Works with: Ollama, LM Studio, vLLM, LocalAI, etc.
            return new ChatOpenAI({
                model: LOCAL_LLM_MODEL,
                configuration: {
                    baseURL: LOCAL_LLM_BASE_URL,
                },
                apiKey: LOCAL_LLM_API_KEY,
                temperature,
            })
        } else if (provider === 'groq') {
            if (!GROQ_API_KEY) {
                throw new Error('Groq provider is not configured. Please set GROQ_API_KEY.')
            }
            return new ChatOpenAI({
                model: GROQ_MODEL,
                apiKey: GROQ_API_KEY,
                configuration: {
                    baseURL: 'https://api.groq.com/openai/v1',
                },
                temperature,
            })
        } else {
            throw new Error(
                `Unsupported LLM provider: ${provider}. Supported providers: openai, anthropic, local, groq`
            )
        }
    }
}
