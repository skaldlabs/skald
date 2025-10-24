export const NODE_ENV = process.env.NODE_ENV

// postgres
export const DATABASE_URL = process.env.DATABASE_URL

// queue configuration
export const INTER_PROCESS_QUEUE = process.env.INTER_PROCESS_QUEUE

export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
export const REDIS_PORT = process.env.REDIS_PORT || '6379'
export const CHANNEL_NAME = process.env.CHANNEL_NAME || 'process_memo'

export const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost'
export const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672'
export const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest'
export const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'guest'
export const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || '/'
export const RABBITMQ_QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'process_memo'

export const AWS_REGION = process.env.AWS_REGION || 'us-east-2'

// must be set but aren't explicitly read -- aws cli reads them from the environment
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

// llms
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Embedding Provider Configuration
export const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'voyage'

// Voyage AI
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY
export const VOYAGE_EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL || 'voyage-3-large'

// OpenAI
export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large'

// Constants
export const EMBEDDING_VECTOR_DIMENSION = 2048

// Validation
const SUPPORTED_EMBEDDING_PROVIDERS = ['voyage', 'openai']
if (!SUPPORTED_EMBEDDING_PROVIDERS.includes(EMBEDDING_PROVIDER)) {
    throw new Error(
        `Invalid EMBEDDING_PROVIDER: ${EMBEDDING_PROVIDER}. Supported: ${SUPPORTED_EMBEDDING_PROVIDERS.join(', ')}`
    )
}
