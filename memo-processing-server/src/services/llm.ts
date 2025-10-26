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
} from '../settings'
/**
 * LLM Service for creating LLM instances based on configuration
 */
export class LLMService {
    private static provider: string = LLM_PROVIDER

    /**
     * Get an LLM instance based on environment configuration
     * @param temperature - Temperature for the LLM (default: 0 for deterministic output)
     * @returns Configured LLM instance
     */
    static getLLM(temperature: number = 0): BaseChatModel {
        const provider = this.provider

        if (provider === 'openai') {
            return new ChatOpenAI({
                model: OPENAI_MODEL,
                apiKey: OPENAI_API_KEY,
                temperature,
            })
        } else if (provider === 'anthropic') {
            return new ChatAnthropic({
                model: ANTHROPIC_MODEL,
                apiKey: ANTHROPIC_API_KEY,
                temperature,
            })
        } else if (provider === 'local') {
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
        } else {
            throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: openai, anthropic, local`)
        }
    }
}
