import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatBedrockConverse } from '@langchain/aws'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import {
    LLM_PROVIDER,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    LOCAL_LLM_MODEL,
    LOCAL_LLM_BASE_URL,
    LOCAL_LLM_API_KEY,
    GROQ_API_KEY,
    GEMINI_API_KEY,
    BEDROCK_AWS_REGION,
    BEDROCK_AWS_ACCESS_KEY_ID,
    BEDROCK_AWS_SECRET_ACCESS_KEY,
    BEDROCK_ENABLED,
} from '../settings'
import { DEFAULT_LLM_MODELS } from '@/llmModels'

interface GetLLMParams {
    temperature?: number
    providerOverride?: 'openai' | 'anthropic' | 'local' | 'groq' | 'gemini'
    purpose?: 'chat' | 'classification'
}

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
    static getLLM({ temperature = 0, providerOverride, purpose = 'chat' }: GetLLMParams): BaseChatModel {
        let provider = this.provider
        if (providerOverride) {
            provider = providerOverride
        }

        if (provider === 'openai') {
            if (!OPENAI_API_KEY) {
                throw new Error('OpenAI provider is not configured. Please set OPENAI_API_KEY.')
            }
            return new ChatOpenAI({
                model:
                    purpose === 'chat'
                        ? DEFAULT_LLM_MODELS.openai.defaultChatModel.slug
                        : DEFAULT_LLM_MODELS.openai.defaultClassificationModel.slug,
                apiKey: OPENAI_API_KEY,
                temperature,
            })
        } else if (provider === 'anthropic') {
            const modelConfig =
                purpose === 'chat'
                    ? DEFAULT_LLM_MODELS.anthropic.defaultChatModel
                    : DEFAULT_LLM_MODELS.anthropic.defaultClassificationModel

            if (BEDROCK_ENABLED && BEDROCK_AWS_ACCESS_KEY_ID && BEDROCK_AWS_SECRET_ACCESS_KEY) {
                return new ChatBedrockConverse({
                    model: modelConfig.bedrockSlug,
                    region: BEDROCK_AWS_REGION,
                    credentials: {
                        accessKeyId: BEDROCK_AWS_ACCESS_KEY_ID,
                        secretAccessKey: BEDROCK_AWS_SECRET_ACCESS_KEY,
                    },
                    temperature,
                })
            }

            if (!ANTHROPIC_API_KEY) {
                throw new Error('Anthropic provider is not configured. Please set ANTHROPIC_API_KEY.')
            }
            return new ChatAnthropic({
                model: modelConfig.slug,
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
                model:
                    purpose === 'chat'
                        ? DEFAULT_LLM_MODELS.groq.defaultChatModel.slug
                        : DEFAULT_LLM_MODELS.groq.defaultClassificationModel.slug,
                apiKey: GROQ_API_KEY,
                configuration: {
                    baseURL: 'https://api.groq.com/openai/v1',
                },
                temperature,
            })
        } else if (provider === 'gemini') {
            if (!GEMINI_API_KEY) {
                throw new Error('Gemini provider is not configured. Please set GEMINI_API_KEY.')
            }
            return new ChatGoogleGenerativeAI({
                model:
                    purpose === 'chat'
                        ? DEFAULT_LLM_MODELS.gemini.defaultChatModel.slug
                        : DEFAULT_LLM_MODELS.gemini.defaultClassificationModel.slug,
                apiKey: GEMINI_API_KEY,
                temperature,
            })
        } else {
            throw new Error(
                `Unsupported LLM provider: ${provider}. Supported providers: openai, anthropic, local, groq, gemini`
            )
        }
    }
}
