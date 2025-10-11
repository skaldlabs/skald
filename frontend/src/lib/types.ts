export interface ApiStreamData {
    type: 'token' | 'sources' | 'chat_context' | 'done' | 'error'
    data?: unknown
}

export interface ApiErrorData {
    message: string
    code?: string
    details?: Record<string, unknown>
}
