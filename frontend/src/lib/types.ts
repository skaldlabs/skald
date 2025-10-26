export interface ApiStreamData {
    type: 'token' | 'sources' | 'chat_context' | 'done' | 'error'
    content?: string
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

// Keep this in sync with the Memo serializer in skald/api/memo_api.py
export interface Memo {
    uuid: string
    created_at: string
    updated_at: string
    title: string
    summary: string
    content_length: number
    metadata: Record<string, unknown>
    client_reference_id: string | null
}

// Keep this in sync with the DetailedMemoSerializer in skald/api/memo_api.py
export interface DetailedMemo {
    uuid: string
    created_at: string
    updated_at: string
    title: string
    content: string | null
    summary: string | null
    content_length: number
    metadata: Record<string, unknown>
    client_reference_id: string | null
    source: string | null
    type: string | null
    expiration_date: string | null
    archived: boolean
    pending: boolean
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
    title: string
    id: string
    content_snippet: string
    summary: string
    distance: number | null
}

export type SearchMethod = 'title_contains' | 'title_startswith' | 'chunk_vector_search'
