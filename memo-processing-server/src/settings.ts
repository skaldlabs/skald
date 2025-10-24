export const NODE_ENV = process.env.NODE_ENV

// postgres
export const DATABASE_URL = process.env.DATABASE_URL

// queue configuration
export const USE_SQS = process.env.USE_SQS === 'true' // legacy support
export const INTER_PROCESS_QUEUE = USE_SQS
    ? 'sqs'
    : process.env.INTER_PROCESS_QUEUE || (process.env.NODE_ENV === 'production' ? 'sqs' : 'redis')

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

// voyage
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY
