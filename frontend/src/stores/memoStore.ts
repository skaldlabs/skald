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

interface CreateFileMemoPayload {
    file: File
    title?: string
    source?: string
    reference_id?: string
    expiration_date?: string
    tags?: string[]
    metadata?: Record<string, unknown>
}

interface MemoStatusResponse {
    memo_uuid: string
    status: 'processing' | 'processed' | 'error'
    processing_started_at: string | null
    processing_completed_at: string | null
    error_reason: string | null
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
    pollingIntervals: Map<string, NodeJS.Timeout>
    fetchMemos: (page?: number, pageSize?: number) => Promise<void>
    searchMemos: (query: string, method: SearchMethod) => Promise<void>
    createMemo: (payload: CreateMemoPayload) => Promise<boolean>
    createFileMemo: (payload: CreateFileMemoPayload) => Promise<boolean>
    deleteMemo: (memoUuid: string) => Promise<boolean>
    getMemoDetails: (memoUuid: string) => Promise<DetailedMemo | null>
    getMemoStatus: (memoUuid: string) => Promise<MemoStatusResponse | null>
    updateMemoStatus: (memoUuid: string, status: 'processing' | 'processed' | 'error') => void
    startPollingProcessingMemos: () => void
    stopPollingMemo: (memoUuid: string) => void
    stopAllPolling: () => void
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
    pollingIntervals: new Map(),

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
                metadata: {},
                client_reference_id: null,
                created_at: '',
                updated_at: '',
                distance: result.distance,
                processing_status: 'processed',
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

    createFileMemo: async (payload: CreateFileMemoPayload) => {
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }

        try {
            const formData = new FormData()
            formData.append('file', payload.file)

            if (payload.title) {
                formData.append('title', payload.title)
            }
            if (payload.source) {
                formData.append('source', payload.source)
            }
            if (payload.reference_id) {
                formData.append('reference_id', payload.reference_id)
            }
            if (payload.expiration_date) {
                formData.append('expiration_date', payload.expiration_date)
            }
            if (payload.tags && payload.tags.length > 0) {
                formData.append('tags', JSON.stringify(payload.tags))
            }
            if (payload.metadata) {
                formData.append('metadata', JSON.stringify(payload.metadata))
            }

            const response = await api.postFile<{ memo_uuid: string }>(
                `/v1/memo/?project_id=${currentProject.uuid}`,
                formData
            )

            if (response.error) {
                toast.error(`Failed to upload document: ${response.error}`)
                return false
            }

            await get().fetchMemos()
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to upload document'
            toast.error(`Failed to upload document: ${errorMsg}`)
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

    getMemoStatus: async (memoUuid: string) => {
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }

        try {
            const response = await api.get<MemoStatusResponse>(
                `/v1/memo/${memoUuid}/status/?project_id=${currentProject.uuid}`
            )

            if (response.error || !response.data) {
                return null
            }

            if (response.data.status === 'processed') {
                const memoDetails = await get().getMemoDetails(memoUuid)
                if (memoDetails) {
                    const currentMemos = get().memos
                    const memoIndex = currentMemos.findIndex((m) => m.uuid === memoUuid)

                    const updatedMemo: Memo = {
                        uuid: memoDetails.uuid,
                        created_at: memoDetails.created_at,
                        updated_at: memoDetails.updated_at,
                        title: memoDetails.title,
                        summary: memoDetails.summary || '',
                        metadata: memoDetails.metadata,
                        client_reference_id: memoDetails.client_reference_id,
                        processing_status: memoDetails.processing_status,
                    }

                    if (memoIndex !== -1) {
                        const updatedMemos = [...currentMemos]
                        updatedMemos[memoIndex] = updatedMemo
                        set({ memos: updatedMemos })
                    } else {
                        set({ memos: [...currentMemos, updatedMemo] })
                    }
                }
            }

            return response.data
        } catch {
            return null
        }
    },

    updateMemoStatus: (memoUuid: string, status: 'processing' | 'processed' | 'error') => {
        const currentMemos = get().memos
        const updatedMemos = currentMemos.map((memo) =>
            memo.uuid === memoUuid ? { ...memo, processing_status: status } : memo
        )
        set({ memos: updatedMemos })
    },

    startPollingProcessingMemos: () => {
        const currentMemos = get().memos
        const processingMemos = currentMemos.filter((memo) => memo.processing_status === 'processing')

        processingMemos.forEach((memo) => {
            // Don't start polling if already polling this memo
            if (get().pollingIntervals.has(memo.uuid)) {
                return
            }

            const pollMemo = async (pollCount: number) => {
                const statusResponse = await get().getMemoStatus(memo.uuid)
                if (statusResponse && statusResponse.status !== 'processing') {
                    // Status changed, update the memo
                    get().updateMemoStatus(memo.uuid, statusResponse.status)
                    // Stop polling this memo
                    get().stopPollingMemo(memo.uuid)
                    return
                }

                // if still processing add a exponential delay
                const nextPollCount = pollCount + 1
                const newDelay = Math.min(nextPollCount * 3000, 9000)
                const timeoutId = setTimeout(() => pollMemo(nextPollCount), newDelay)
                get().pollingIntervals.set(memo.uuid, timeoutId)
            }

            // Poll immediately once
            pollMemo(0)
        })
    },

    stopPollingMemo: (memoUuid: string) => {
        const timeoutId = get().pollingIntervals.get(memoUuid)
        if (timeoutId) {
            clearTimeout(timeoutId)
            const newIntervals = new Map(get().pollingIntervals)
            newIntervals.delete(memoUuid)
            set({ pollingIntervals: newIntervals })
        }
    },

    stopAllPolling: () => {
        get().pollingIntervals.forEach((timeoutId) => {
            clearTimeout(timeoutId)
        })
        set({ pollingIntervals: new Map() })
    },
}))
