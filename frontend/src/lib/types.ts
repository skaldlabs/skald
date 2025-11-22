export interface ApiStreamData {
    type: 'token' | 'sources' | 'chat_context' | 'done' | 'error' | 'references'
    content?: string
    data?: unknown
    chat_id?: string
}

export interface ApiErrorData {
    error: string
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
    query_rewrite_enabled: boolean
}

// Keep this in sync with backend/api/memo.ts
export interface Memo {
    uuid: string
    created_at: string
    updated_at: string
    title: string
    summary: string
    metadata: Record<string, unknown>
    client_reference_id: string | null
    distance?: number | null
    processing_status: 'processing' | 'processed' | 'error'
}

// Keep this in sync with backend/api/memo.ts
export interface DetailedMemo {
    uuid: string
    created_at: string
    updated_at: string
    title: string
    content: string | null
    summary: string | null
    metadata: Record<string, unknown>
    client_reference_id: string | null
    source: string | null
    type: string | null
    expiration_date: string | null
    archived: boolean
    processing_status: 'processing' | 'processed' | 'error'
    tags: MemoTag[]
    chunks: MemoChunk[]
}

export interface MemoTag {
    uuid: string
    tag: string
}

export interface MemoChunk {
    uuid: string
    chunk_content: string
    chunk_index: number
}

export interface SearchResult {
    memo_title: string
    memo_uuid: string
    chunk_uuid: string
    content_snippet: string
    memo_summary: string
    chunk_content: string
    distance: number | null
}

export type SearchMethod = 'title_contains' | 'title_startswith' | 'chunk_vector_search'

// Keep this in sync with backend/api/chat.ts
export interface Chat {
    uuid: string
    created_at: string
    title: string
    message_count: number
    last_message_at: string
}

// Keep this in sync with backend/api/chat.ts
export interface ChatMessage {
    uuid: string
    content: string
    sent_by: 'user' | 'model'
    sent_at: string
    skald_system_prompt?: string
    client_system_prompt?: string
}

// Keep this in sync with backend/api/chat.ts
export interface DetailedChat {
    uuid: string
    created_at: string
    messages: ChatMessage[]
}

// Keep this in sync with backend/src/lib/filterUtils.ts
export type FilterOperator = 'eq' | 'neq' | 'contains' | 'startswith' | 'endswith' | 'in' | 'not_in'
export type FilterType = 'native_field' | 'custom_metadata'
export type NativeField = 'title' | 'source' | 'client_reference_id' | 'tags'

export interface MemoFilter {
    id: string // Frontend-only for UI key management
    field: string
    operator: FilterOperator
    value: string | string[]
    filter_type: FilterType
}
