import { VoyageAIClient } from 'voyageai'
import { EmbedRequestInputType, EmbedResponseDataItem } from 'voyageai/api/types'

const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY })

const VOYAGE_EMBEDDING_MODEL = 'voyage-3-large'
const EMBEDDING_VECTOR_DIMENSION = 2048

export const generateVectorEmbeddingForStorage = async (input: string): Promise<number[]> => {
    const result = await client.embed({
        input: input,
        model: VOYAGE_EMBEDDING_MODEL,
        inputType: EmbedRequestInputType.Document,
        outputDimension: EMBEDDING_VECTOR_DIMENSION,
    })

    if (!result.data?.[0] || !result.data?.[0].embedding) {
        throw new Error('Could not generate vector embedding for storage')
    }

    return result.data?.[0].embedding
}

export const generateVectorEmbeddingForSearch = async (input: string): Promise<number[]> => {
    const result = await client.embed({
        input: input,
        model: VOYAGE_EMBEDDING_MODEL,
        inputType: EmbedRequestInputType.Query,
        outputDimension: EMBEDDING_VECTOR_DIMENSION,
    })

    if (!result.data?.[0] || !result.data?.[0].embedding) {
        throw new Error('Could not generate vector embedding for search')
    }

    return result.data?.[0].embedding
}
