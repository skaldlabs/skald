import { create } from 'zustand'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Memo, DetailedMemo, SearchResult, SearchMethod } from '@/lib/types'
import { useProjectStore } from './projectStore'

interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

interface CreateMemoPayload {
    title: string
    content: string
    source?: string
    type?: string
    client_reference_id?: string
    expiration_date?: string
    tags?: string[]
    metadata?: Record<string, unknown>
}

interface MemoState {
    memos: Memo[]
    loading: boolean
    error: string | null
    searchQuery: string
    searchMethod: SearchMethod
    isSearchMode: boolean
    totalCount: number
    currentPage: number
    pageSize: number
    fetchMemos: (page?: number, pageSize?: number) => Promise<void>
    searchMemos: (query: string, method: SearchMethod) => Promise<void>
    createMemo: (payload: CreateMemoPayload) => Promise<boolean>
    deleteMemo: (memoUuid: string) => Promise<boolean>
    getMemoDetails: (memoUuid: string) => Promise<DetailedMemo | null>
    setSearchQuery: (query: string) => void
    clearSearch: () => void
}

export const useMemoStore = create<MemoState>((set, get) => ({
    memos: [],
    loading: false,
    error: null,
    searchQuery: '',
    searchMethod: 'chunk_vector_search',
    isSearchMode: false,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,

    fetchMemos: async (page = 1, pageSize = 50) => {
        set({ loading: true, error: null, isSearchMode: false })
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }
        try {
            const response = await api.get<PaginatedResponse<Memo>>(
                `/v1/memo/?page=${page}&page_size=${pageSize}&project_id=${currentProject.uuid}`
            )

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch memos'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch memos: ${errorMsg}`)
                return
            }

            set({
                memos: response.data.results,
                totalCount: response.data.count,
                currentPage: page,
                pageSize: pageSize,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch memos'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch memos: ${errorMsg}`)
        }
    },

    searchMemos: async (query: string, method: SearchMethod) => {
        if (!query.trim()) {
            get().fetchMemos()
            return
        }

        set({ loading: true, error: null, isSearchMode: true })
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }

        try {
            const response = await api.post<{ results: SearchResult[] }>('/v1/search/', {
                project_id: currentProject.uuid,
                query: query,
                search_method: method,
                limit: 50,
            })

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Search failed'
                set({ loading: false, error: errorMsg })
                toast.error(`Search failed: ${errorMsg}`)
                return
            }

            // Convert search results to memo format
            const searchResultMemos: Memo[] = response.data.results.map((result) => ({
                uuid: result.memo_uuid,
                title: result.memo_title,
                summary: result.memo_summary,
                content_length: result.content_snippet.length,
                metadata: {},
                client_reference_id: null,
                created_at: '',
                updated_at: '',
                distance: result.distance,
            }))

            set({
                memos: searchResultMemos,
                totalCount: searchResultMemos.length,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Search failed'
            set({ loading: false, error: errorMsg })
            toast.error(`Search failed: ${errorMsg}`)
        }
    },

    createMemo: async (payload: CreateMemoPayload) => {
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }

        try {
            const apiPayload = {
                title: payload.title,
                content: payload.content,
                source: payload.source,
                type: payload.type,
                reference_id: payload.client_reference_id,
                expiration_date: payload.expiration_date,
                tags: payload.tags,
                metadata: payload.metadata,
            }

            const response = await api.post<{ ok: boolean }>(`/v1/memo/?project_id=${currentProject.uuid}`, apiPayload)

            if (response.error) {
                toast.error(`Failed to create memo: ${response.error}`)
                return false
            }

            await get().fetchMemos()
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to create memo'
            toast.error(`Failed to create memo: ${errorMsg}`)
            return false
        }
    },

    deleteMemo: async (memoUuid: string) => {
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }
        const currentMemos = get().memos
        const memoToDelete = currentMemos.find((m) => m.uuid === memoUuid)
        const updatedMemos = currentMemos.filter((m) => m.uuid !== memoUuid)

        set({
            memos: updatedMemos,
            totalCount: Math.max(0, get().totalCount - 1),
        })

        try {
            const response = await api.delete(`/v1/memo/${memoUuid}/?project_id=${currentProject.uuid}`)

            if (response.error) {
                if (memoToDelete) {
                    set({
                        memos: currentMemos,
                        totalCount: get().totalCount + 1,
                    })
                }
                toast.error(`Failed to delete memo: ${response.error}`)
                return false
            }

            toast.success('Memo deleted successfully')
            return true
        } catch (error) {
            if (memoToDelete) {
                set({
                    memos: currentMemos,
                    totalCount: get().totalCount + 1,
                })
            }
            const errorMsg = error instanceof Error ? error.message : 'Failed to delete memo'
            toast.error(`Failed to delete memo: ${errorMsg}`)
            return false
        }
    },

    getMemoDetails: async (memoUuid: string) => {
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }

        try {
            const response = await api.get<DetailedMemo>(`/v1/memo/${memoUuid}/?project_id=${currentProject.uuid}`)

            if (response.error || !response.data) {
                toast.error(`Failed to fetch memo details: ${response.error}`)
                return null
            }

            return response.data
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch memo details'
            toast.error(`Failed to fetch memo details: ${errorMsg}`)
            return null
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query })
    },

    clearSearch: () => {
        set({ searchQuery: '', isSearchMode: false })
        get().fetchMemos()
    },
}))
