export interface ApiStreamData {
    type: 'token' | 'sources' | 'chat_context' | 'done' | 'error'
    content?: string
    data?: unknown
    chat_id?: string
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
