import {
    EMBEDDING_PROVIDER,
    EMBEDDING_VECTOR_DIMENSION,
    VOYAGE_API_KEY,
    VOYAGE_EMBEDDING_MODEL,
    OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL,
    LOCAL_EMBEDDING_MODEL,
} from '../settings'
import { VoyageAIClient } from 'voyageai'
import OpenAI from 'openai'
import { pipeline } from '@huggingface/transformers'

const TARGET_DIMENSION = EMBEDDING_VECTOR_DIMENSION

class EmbeddingService {
    private static normalizeEmbedding(embedding: number[]): number[] {
        const currentDim = embedding.length

        if (currentDim === TARGET_DIMENSION) {
            return embedding
        } else if (currentDim < TARGET_DIMENSION) {
            // Pad with zeros
            return [...embedding, ...Array(TARGET_DIMENSION - currentDim).fill(0)]
        } else {
            throw new Error(`Embedding dimension ${currentDim} exceeds maximum supported dimension ${TARGET_DIMENSION}`)
        }
    }

    private static async generateVoyageEmbedding(content: string, inputType: 'document' | 'query'): Promise<number[]> {
        const client = new VoyageAIClient({ apiKey: VOYAGE_API_KEY })

        const result = await client.embed({
            input: content,
            model: VOYAGE_EMBEDDING_MODEL,
            inputType: inputType,
            outputDimension: TARGET_DIMENSION,
        })

        if (!result.data?.[0] || !result.data?.[0].embedding) {
            throw new Error('Could not generate vector embedding for storage')
        }

        return result.data?.[0].embedding
    }

    private static async generateOpenAIEmbedding(content: string): Promise<number[]> {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY })

        const response = await client.embeddings.create({
            input: content,
            model: OPENAI_EMBEDDING_MODEL,
            dimensions: TARGET_DIMENSION,
        })

        return response.data[0].embedding
    }

    private static async generateTransformerEmbedding(content: string): Promise<number[]> {
        const client = await pipeline('feature-extraction', 'Xenova/' + LOCAL_EMBEDDING_MODEL)

        const response = await client(content, { pooling: 'mean', normalize: true })
        return response.data
    }

    static async generateEmbedding(content: string, usage: 'storage' | 'search'): Promise<number[]> {
        let embedding: number[]

        if (EMBEDDING_PROVIDER === 'voyage') {
            const inputType = usage === 'storage' ? 'document' : 'query'
            embedding = await this.generateVoyageEmbedding(content, inputType)
        } else if (EMBEDDING_PROVIDER === 'openai') {
            embedding = await this.generateOpenAIEmbedding(content)
        } else if (EMBEDDING_PROVIDER === 'local') {
            embedding = await this.generateTransformerEmbedding(content)
        } else {
            throw new Error(`Unsupported embedding provider: ${EMBEDDING_PROVIDER}`)
        }

        return this.normalizeEmbedding(embedding)
    }
}

export { EmbeddingService }
