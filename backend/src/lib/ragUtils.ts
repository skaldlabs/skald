import { RAGConfig } from '@/agents/chatAgent/ragGraph'
import { LLM_PROVIDER } from '@/settings'
import { AVAILABLE_LLM_PROVIDERS } from '@/api/config'

export function parseRagConfig(ragConfig: Record<string, any>): {
    parsedRagConfig: RAGConfig | null
    error: string | null
} {
    const defaults = {
        queryRewriteEnabled: false,
        rerankingEnabled: true,
        vectorSearchTopK: 100,
        similarityThreshold: 0.8,
        rerankingTopK: 50,
        referencesEnabled: false,
    }

    // Parse and validate llmProvider (snake_case only)
    const llmProvider = ragConfig.llm_provider || ragConfig.llmProvider || LLM_PROVIDER

    if (!AVAILABLE_LLM_PROVIDERS.map((provider) => provider.provider).includes(llmProvider)) {
        return {
            parsedRagConfig: null,
            error: `Invalid LLM provider: ${llmProvider}. Supported providers: ${AVAILABLE_LLM_PROVIDERS.map((provider) => provider.provider).join(', ')}`,
        }
    }

    // queryRewriteEnabled must be a boolean (snake_case only)
    const queryRewriteEnabled = ragConfig.query_rewrite?.enabled ?? defaults.queryRewriteEnabled
    if (typeof queryRewriteEnabled !== 'boolean') {
        return {
            parsedRagConfig: null,
            error: `Invalid query rewrite enabled: ${queryRewriteEnabled}. Must be a boolean.`,
        }
    }

    // rerankingEnabled must be a boolean (snake_case only)
    const rerankingEnabled = ragConfig.reranking?.enabled ?? defaults.rerankingEnabled
    if (typeof rerankingEnabled !== 'boolean') {
        return {
            parsedRagConfig: null,
            error: `Invalid reranking enabled: ${rerankingEnabled}. Must be a boolean.`,
        }
    }

    const referencesEnabled = ragConfig.references?.enabled ?? defaults.referencesEnabled
    if (typeof referencesEnabled !== 'boolean') {
        return {
            parsedRagConfig: null,
            error: `Invalid references enabled: ${referencesEnabled}. Must be a boolean.`,
        }
    }

    // vectorSearchTopK must be between 1 and 200 (snake_case only)
    const vectorSearchTopK = ragConfig.vector_search?.top_k ?? defaults.vectorSearchTopK
    if (typeof vectorSearchTopK !== 'number' || vectorSearchTopK < 1 || vectorSearchTopK > 200) {
        return {
            parsedRagConfig: null,
            error: `Invalid vector search topK: ${vectorSearchTopK}. Must be a number between 1 and 200.`,
        }
    }

    // similarityThreshold must be between 0 and 1 (snake_case only)
    const similarityThreshold = ragConfig.vector_search?.similarity_threshold ?? defaults.similarityThreshold
    if (typeof similarityThreshold !== 'number' || similarityThreshold < 0 || similarityThreshold > 1) {
        return {
            parsedRagConfig: null,
            error: `Invalid similarity threshold: ${similarityThreshold}. Must be a number between 0 and 1.`,
        }
    }

    // rerankingTopK must be between 1 and 100 and must be smaller than vector search top k (snake_case only)
    const rerankingTopK = ragConfig.reranking?.top_k ?? defaults.rerankingTopK
    if (typeof rerankingTopK !== 'number' || rerankingTopK < 1 || rerankingTopK > 100) {
        return {
            parsedRagConfig: null,
            error: `Invalid reranking topK: ${rerankingTopK}. Must be a number between 1 and 100.`,
        }
    }

    if (rerankingTopK > vectorSearchTopK) {
        return {
            parsedRagConfig: null,
            error: `Reranking topK (${rerankingTopK}) must be less than or equal to vector search topK (${vectorSearchTopK}).`,
        }
    }

    const result = {
        parsedRagConfig: {
            llmProvider: llmProvider as 'openai' | 'anthropic' | 'local' | 'groq',
            references: {
                enabled: referencesEnabled,
            },
            queryRewrite: {
                enabled: queryRewriteEnabled,
            },
            vectorSearch: {
                topK: vectorSearchTopK,
                similarityThreshold: similarityThreshold,
            },
            reranking: {
                enabled: rerankingEnabled,
                topK: rerankingTopK,
            },
        },
        error: null,
    }
    return result
}
