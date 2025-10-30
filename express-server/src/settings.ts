import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from the main repo's .env file
if (process.env.NODE_ENV === 'development') {
    config({ path: resolve(__dirname, '../../.env') })
} else {
    config({ path: resolve(__dirname, '.env') })
}

function strToBool(input: string | boolean | undefined, defaultValue: boolean = false): boolean {
    if (!input) {
        return defaultValue
    }

    if (typeof input === 'boolean') {
        return input
    }

    if (input === undefined) {
        return false
    }

    const trueTerms = ['true', '1', 'yes', 'y', 't']
    const falseTerms = ['false', '0', 'no', 'n', 'f']

    const normalizedStr = input.trim().toLowerCase()

    if (trueTerms.includes(normalizedStr)) {
        return true
    } else if (falseTerms.includes(normalizedStr)) {
        return false
    } else {
        throw new Error('Input string does not represent a boolean value')
    }
}

export const SECRET_KEY = process.env.SECRET_KEY || 'UNSAFE_DEFAULT_SECRET_KEY'

export const DEBUG = strToBool(process.env.DEBUG)

export const NODE_ENV = process.env.NODE_ENV

// postgres
export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:12345678@localhost/skald2'

// queue configuration
export const INTER_PROCESS_QUEUE = process.env.INTER_PROCESS_QUEUE || 'redis'

export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
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

// ---- LLM Configuration ----
export const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'

// OpenAI
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Anthropic
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219'

// Local LLM
export const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || 'llama-3.1-8b-instruct'
export const LOCAL_LLM_BASE_URL = process.env.LOCAL_LLM_BASE_URL
export const LOCAL_LLM_API_KEY = process.env.LOCAL_LLM_API_KEY || 'not-needed'

// ---- Embedding Provider Configuration ----
export const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'voyage'

// Voyage AI
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY
export const VOYAGE_EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL || 'voyage-3-large'

// OpenAI
export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large'

// Local
export const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8001'

// Constants
export const EMBEDDING_VECTOR_DIMENSION = 2048
export const VECTOR_SEARCH_TOP_K = parseInt(process.env.VECTOR_SEARCH_TOP_K || '100')
export const POST_RERANK_TOP_K = parseInt(process.env.POST_RERANK_TOP_K || '50')

// Validation of LLM and embedding provider configuration on startup
const SUPPORTED_LLM_PROVIDERS = ['openai', 'anthropic', 'local']
if (!SUPPORTED_LLM_PROVIDERS.includes(LLM_PROVIDER)) {
    throw new Error(`Invalid LLM_PROVIDER: ${LLM_PROVIDER}. Supported: ${SUPPORTED_LLM_PROVIDERS.join(', ')}`)
}

const SUPPORTED_EMBEDDING_PROVIDERS = ['voyage', 'openai', 'local']
if (!SUPPORTED_EMBEDDING_PROVIDERS.includes(EMBEDDING_PROVIDER)) {
    throw new Error(
        `Invalid EMBEDDING_PROVIDER: ${EMBEDDING_PROVIDER}. Supported: ${SUPPORTED_EMBEDDING_PROVIDERS.join(', ')}`
    )
}

// Warn if LLM provider API keys are missing
if (LLM_PROVIDER === 'openai' && !OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set in production')
} else if (LLM_PROVIDER === 'anthropic' && !ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set in production')
} else if (LLM_PROVIDER === 'local' && !LOCAL_LLM_BASE_URL) {
    console.warn('LOCAL_LLM_BASE_URL not set for local provider')
}

// Warn if embedding provider API keys are missing
if (EMBEDDING_PROVIDER === 'voyage' && !VOYAGE_API_KEY) {
    console.warn('VOYAGE_API_KEY not set in production')
} else if (EMBEDDING_PROVIDER === 'openai' && !OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set for embedding provider in production')
} else if (EMBEDDING_PROVIDER === 'local' && !EMBEDDING_SERVICE_URL) {
    console.warn('EMBEDDING_SERVICE_URL not set for local provider')
}

export const SENTRY_DSN = process.env.SENTRY_DSN

// ---- CORS Configuration ----
export const CORS_ALLOW_CREDENTIALS = true

// Get allowed origins from environment or use defaults
const CORS_ORIGINS_ENV = process.env.CORS_ALLOWED_ORIGINS || ''
let CORS_ALLOWED_ORIGINS: string[]

if (CORS_ORIGINS_ENV) {
    CORS_ALLOWED_ORIGINS = CORS_ORIGINS_ENV.split(',').map((origin) => origin.trim())
} else if (DEBUG) {
    CORS_ALLOWED_ORIGINS = ['http://localhost:8000', 'http://localhost:3000', 'http://localhost:5173']
} else {
    CORS_ALLOWED_ORIGINS = ['https://app.useskald.com', 'https://api.useskald.com', 'https://platform.useskald.com']
}

// Add self-hosted deployment URLs
export const IS_SELF_HOSTED_DEPLOY = strToBool(process.env.IS_SELF_HOSTED_DEPLOY)
if (IS_SELF_HOSTED_DEPLOY) {
    const FRONTEND_URL = process.env.FRONTEND_URL
    const API_URL = process.env.API_URL
    if (FRONTEND_URL) {
        CORS_ALLOWED_ORIGINS.push(FRONTEND_URL)
    }
    if (API_URL) {
        CORS_ALLOWED_ORIGINS.push(API_URL)
    }
}

export { CORS_ALLOWED_ORIGINS }

// ---- Email Configuration ----
const DEFAULT_EMAIL_VERIFICATION_ENABLED = !(DEBUG || IS_SELF_HOSTED_DEPLOY)
export const EMAIL_VERIFICATION_ENABLED = strToBool(
    process.env.EMAIL_VERIFICATION_ENABLED,
    DEFAULT_EMAIL_VERIFICATION_ENABLED
)
