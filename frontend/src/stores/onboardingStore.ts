import { create } from 'zustand'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/projectStore'

interface SearchResult {
    title: string
    uuid: string
    content_snippet: string
    summary: string
    distance: number | null
}

interface ChatMessage {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
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

    // Chat state
    chatQuery: string
    chatMessages: ChatMessage[]
    isChatting: boolean
    hasChatted: boolean

    // Search state
    searchQuery: string
    searchResults: SearchResult[]
    isSearching: boolean
    hasSearched: boolean

    // Actions
    generateApiKey: () => Promise<void>
    setApiKey: (apiKey: string) => void
    setMemoTitle: (title: string) => void
    setMemoContent: (content: string) => void
    createMemo: () => Promise<void>
    setChatQuery: (query: string) => void
    sendChatMessage: () => Promise<void>
    setSearchQuery: (query: string) => void
    searchMemos: () => Promise<void>
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
    chatQuery: '',
    chatMessages: [],
    isChatting: false,
    hasChatted: false,
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

    setApiKey: (apiKey: string) => {
        set({ apiKey })
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

        if (!apiKey) {
            toast.error('Please generate an API key first')
            return
        }

        if (!currentProject) {
            toast.error('No project selected')
            return
        }

        if (!memoTitle.trim() || !memoContent.trim()) {
            toast.error('Please provide both title and content')
            return
        }

        set({ isCreatingMemo: true })

        try {
            const response = await api.post('/v1/memo/', {
                title: memoTitle,
                content: memoContent,
                project_id: currentProject.uuid,
            })

            if (response.error) {
                throw new Error(response.error)
            }

            toast.success('Memo created successfully!')
            set({
                memoCreated: true,
                isCreatingMemo: false,
            })
        } catch (error) {
            toast.error('Failed to create memo')
            console.error(error)
            set({ isCreatingMemo: false })
        }
    },

    setChatQuery: (query: string) => {
        set({ chatQuery: query })
    },

    sendChatMessage: async () => {
        const { chatQuery, chatMessages } = get()
        const { currentProject } = useProjectStore.getState()

        if (!currentProject) {
            toast.error('No project selected')
            return
        }

        if (!chatQuery.trim()) {
            toast.error('Please enter a message')
            return
        }

        set({ isChatting: true, hasChatted: true })

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            content: chatQuery,
            role: 'user',
            timestamp: new Date(),
        }

        const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: '',
            role: 'assistant',
            timestamp: new Date(),
        }

        set({
            chatMessages: [...chatMessages, userMessage, assistantMessage],
            chatQuery: '',
        })

        try {
            let assistantContent = ''
            let isStreamComplete = false

            const cleanup = api.stream(
                '/v1/chat/',
                {
                    query: chatQuery,
                    stream: true,
                    project_id: currentProject.uuid,
                },
                (data) => {
                    if (data.type === 'token') {
                        assistantContent += data.content
                        // Update the assistant message in real-time
                        set((state) => ({
                            chatMessages: state.chatMessages.map((msg) =>
                                msg.id === assistantMessage.id ? { ...msg, content: assistantContent } : msg
                            ),
                        }))
                    } else if (data.type === 'done') {
                        isStreamComplete = true
                        set({ isChatting: false })
                        cleanup()
                    }
                },
                (error) => {
                    // Only show error if the stream didn't complete successfully
                    if (!isStreamComplete) {
                        console.error('Chat stream error:', error)
                        toast.error('Failed to send chat message')
                        set({ isChatting: false })
                        cleanup()
                    }
                }
            )
        } catch (error) {
            toast.error('Failed to send chat message')
            console.error(error)
            set({ isChatting: false })
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query })
    },

    searchMemos: async () => {
        const { apiKey, searchQuery } = get()
        const { currentProject } = useProjectStore.getState()

        if (!apiKey) {
            toast.error('Please generate an API key first')
            return
        }

        if (!currentProject) {
            toast.error('No project selected')
            return
        }

        if (!searchQuery.trim()) {
            toast.error('Please enter a search query')
            return
        }

        set({ isSearching: true, hasSearched: true })

        try {
            const response = await api.post('/v1/search/', {
                query: searchQuery,
                search_method: 'chunk_vector_search',
                limit: 5,
                project_id: currentProject.uuid,
            })

            if (response.error) {
                throw new Error(response.error)
            }

            const results = (response.data as any)?.results || []

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

    reset: () => {
        set({
            apiKey: null,
            isGeneratingApiKey: false,
            memoTitle: '',
            memoContent: '',
            isCreatingMemo: false,
            memoCreated: false,
            chatQuery: '',
            chatMessages: [],
            isChatting: false,
            hasChatted: false,
            searchQuery: '',
            searchResults: [],
            isSearching: false,
            hasSearched: false,
        })
    },
}))
