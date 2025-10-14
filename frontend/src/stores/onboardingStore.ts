import { create } from 'zustand'
import { domain } from '@/lib/api'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/projectStore'

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    const name = 'csrftoken'
    let cookieValue = null
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

interface SearchResult {
    title: string
    uuid: string
    content_snippet: string
    summary: string
    distance: number | null
}

interface OnboardingState {
    // API Key state
    apiKey: string | null
    isGeneratingApiKey: boolean

    // Memo creation state
    memoTitle: string
    memoContent: string
    isCreatingMemo: boolean
    memoCreated: boolean

    // Search state
    searchQuery: string
    searchResults: SearchResult[]
    isSearching: boolean
    hasSearched: boolean

    // Actions
    generateApiKey: () => Promise<void>
    setMemoTitle: (title: string) => void
    setMemoContent: (content: string) => void
    createMemo: () => Promise<void>
    setSearchQuery: (query: string) => void
    searchMemos: () => Promise<void>
    generateSampleMemo: () => void
    generateSampleSearch: () => void
    reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    // Initial state
    apiKey: null,
    isGeneratingApiKey: false,
    memoTitle: '',
    memoContent: '',
    isCreatingMemo: false,
    memoCreated: false,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    hasSearched: false,

    generateApiKey: async () => {
        const { currentProject, generateApiKey } = useProjectStore.getState()

        if (!currentProject) {
            toast.error('No project selected')
            return
        }

        set({ isGeneratingApiKey: true })

        try {
            const apiKey = await generateApiKey(currentProject.uuid)
            if (apiKey) {
                set({ apiKey, isGeneratingApiKey: false })
            } else {
                set({ isGeneratingApiKey: false })
            }
        } catch (error) {
            console.error(error)
            set({ isGeneratingApiKey: false })
            toast.error('Failed to generate API key')
        }
    },

    setMemoTitle: (title: string) => {
        set({ memoTitle: title })
    },

    setMemoContent: (content: string) => {
        set({ memoContent: content })
    },

    createMemo: async () => {
        const { apiKey, memoTitle, memoContent } = get()
        const { currentProject } = useProjectStore.getState()

        if (!apiKey || !currentProject) {
            toast.error('Please generate an API key first')
            return
        }

        if (!memoTitle.trim() || !memoContent.trim()) {
            toast.error('Please provide both title and content')
            return
        }

        set({ isCreatingMemo: true })

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            }

            const csrfToken = getCsrfToken()
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken
            }

            const response = await fetch(`${domain}/api/v1/memo/`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    title: memoTitle,
                    content: memoContent,
                    project_id: currentProject.uuid,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create memo')
            }

            toast.success('Memo created successfully!')
            set({
                memoCreated: true,
                memoTitle: '',
                memoContent: '',
                isCreatingMemo: false,
            })
        } catch (error) {
            toast.error('Failed to create memo')
            console.error(error)
            set({ isCreatingMemo: false })
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query })
    },

    searchMemos: async () => {
        const { apiKey, searchQuery } = get()
        const { currentProject } = useProjectStore.getState()

        if (!apiKey || !currentProject) {
            toast.error('Please generate an API key first')
            return
        }

        if (!searchQuery.trim()) {
            toast.error('Please enter a search query')
            return
        }

        set({ isSearching: true, hasSearched: true })

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            }

            const csrfToken = getCsrfToken()
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken
            }

            const response = await fetch(`${domain}/api/v1/search/`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    query: searchQuery,
                    search_method: 'summary_vector_search',
                    limit: 5,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to search memos')
            }

            const data = await response.json()
            const results = data.results || []

            set({
                searchResults: results,
                isSearching: false,
            })

            if (results.length > 0) {
                toast.success(`Found ${results.length} result(s)`)
            } else {
                toast.info('No results found')
            }
        } catch (error) {
            toast.error('Failed to search memos')
            console.error(error)
            set({ isSearching: false })
        }
    },

    generateSampleMemo: () => {
        set({
            memoTitle: 'My First Memo',
            memoContent:
                'This is my first memo created using the Skald API. It will be automatically processed, chunked, and made searchable!',
        })
    },

    generateSampleSearch: () => {
        set({ searchQuery: 'first memo' })
    },

    reset: () => {
        set({
            apiKey: null,
            isGeneratingApiKey: false,
            memoTitle: '',
            memoContent: '',
            isCreatingMemo: false,
            memoCreated: false,
            searchQuery: '',
            searchResults: [],
            isSearching: false,
            hasSearched: false,
        })
    },
}))
