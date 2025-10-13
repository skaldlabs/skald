export interface ApiStreamData {
    type: 'token' | 'sources' | 'chat_context' | 'done' | 'error'
    data?: unknown
}

export interface ApiErrorData {
    message: string
    code?: string
    details?: Record<string, unknown>
}

// Keep this in sync with the Project serializer in skald/api/project_api.py
export interface Project {
    uuid: string
    name: string
    organization: string
    owner: string
    created_at: string
    updated_at: string
    has_api_key?: boolean
    api_key_first_12_digits?: string | null
}
