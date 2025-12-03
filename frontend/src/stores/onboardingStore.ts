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
    // Wizard state
    currentStep: 1 | 2 | 3 | 4

    // API Key state
    apiKey: string | null
    isGeneratingApiKey: boolean

    // Memo creation state
    memoTitle: string
    memoContent: string
    isCreatingMemo: boolean
    memoCreated: boolean
    memoUuid: string | null
    isProcessing: boolean
    processingStage: 'idle' | 'chunking' | 'embedding' | 'indexing' | 'complete' | 'error'

    // File upload state
    selectedFile: File | null
    isUploadingFile: boolean

    // Example generation state
    isGeneratingExample: boolean

    // Chat state
    chatQuery: string
    chatMessages: ChatMessage[]
    isChatting: boolean
    hasChatted: boolean
    chatSuggestions: string[]
    isLoadingSuggestions: boolean

    // Search state
    searchQuery: string
    searchResults: SearchResult[]
    isSearching: boolean
    hasSearched: boolean

    // Actions
    setCurrentStep: (step: 1 | 2 | 3 | 4) => void
    nextStep: () => void
    generateApiKey: () => Promise<void>
    setApiKey: (apiKey: string) => void
    setMemoTitle: (title: string) => void
    setMemoContent: (content: string) => void
    createMemo: () => Promise<void>
    setSelectedFile: (file: File | null) => void
    uploadFileMemo: () => Promise<void>
    generateExampleMemo: () => Promise<void>
    pollMemoProcessing: (memoUuid: string) => void
    stopPolling: () => void
    setChatQuery: (query: string) => void
    sendChatMessage: () => Promise<void>
    fetchChatSuggestions: (memoUuid: string) => Promise<void>
    setSearchQuery: (query: string) => void
    searchMemos: () => Promise<void>
    reset: () => void
}

const FALLBACK_SUGGESTIONS = ['What are the main features?', 'How does this work?', 'Tell me more about this']

let pollingInterval: NodeJS.Timeout | null = null

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    // Initial state
    currentStep: 1,
    apiKey: null,
    isGeneratingApiKey: false,
    memoTitle: '',
    memoContent: '',
    isCreatingMemo: false,
    memoCreated: false,
    memoUuid: null,
    isProcessing: false,
    processingStage: 'idle',
    selectedFile: null,
    isUploadingFile: false,
    isGeneratingExample: false,
    chatQuery: '',
    chatMessages: [],
    isChatting: false,
    hasChatted: false,
    chatSuggestions: [],
    isLoadingSuggestions: false,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    hasSearched: false,

    setCurrentStep: (step: 1 | 2 | 3 | 4) => {
        set({ currentStep: step })
    },

    nextStep: () => {
        const { currentStep } = get()
        if (currentStep < 4) {
            set({ currentStep: (currentStep + 1) as 1 | 2 | 3 | 4 })
        }
    },

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
        const { memoTitle, memoContent } = get()
        const { currentProject } = useProjectStore.getState()

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
            const response = await api.post<{ memo_uuid: string }>('/v1/memo/', {
                title: memoTitle,
                content: memoContent,
                project_id: currentProject.uuid,
            })

            if (response.error) {
                throw new Error(response.error)
            }

            const memoUuid = response.data?.memo_uuid

            if (!memoUuid) {
                throw new Error('No memo UUID returned')
            }

            toast.success('Memo created successfully!')
            set({
                memoCreated: true,
                isCreatingMemo: false,
                memoUuid,
                currentStep: 2,
                isProcessing: true,
                processingStage: 'chunking',
            })

            // Start polling for processing status
            get().pollMemoProcessing(memoUuid)
        } catch (error) {
            toast.error('Failed to create memo')
            console.error(error)
            set({ isCreatingMemo: false })
        }
    },

    setSelectedFile: (file: File | null) => {
        set({ selectedFile: file })
    },

    uploadFileMemo: async () => {
        const { selectedFile } = get()
        const { currentProject } = useProjectStore.getState()

        if (!currentProject) {
            toast.error('No project selected')
            return
        }

        if (!selectedFile) {
            toast.error('Please select a file')
            return
        }

        set({ isUploadingFile: true })

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await api.postFile<{ memo_uuid: string }>(
                `/v1/memo/?project_id=${currentProject.uuid}`,
                formData
            )

            if (response.error) {
                throw new Error(response.error)
            }

            const memoUuid = response.data?.memo_uuid

            if (!memoUuid) {
                throw new Error('No memo UUID returned')
            }

            toast.success('File uploaded successfully!')
            set({
                memoCreated: true,
                isUploadingFile: false,
                memoUuid,
                currentStep: 2,
                isProcessing: true,
                processingStage: 'chunking',
            })

            // Start polling for processing status
            get().pollMemoProcessing(memoUuid)
        } catch (error) {
            toast.error('Failed to upload file')
            console.error(error)
            set({ isUploadingFile: false })
        }
    },

    generateExampleMemo: async () => {
        set({ isGeneratingExample: true })

        try {
            // Get organization name from auth store for context
            const { useAuthStore } = await import('@/stores/authStore')
            const organizationName = useAuthStore.getState().user?.organization_name

            const response = await api.get<{ title: string; content: string }>(
                `/onboarding/generate-example-memo?organization_name=${organizationName}`
            )

            if (response.error) {
                throw new Error(response.error)
            }

            if (response.data?.title && response.data?.content) {
                set({
                    memoTitle: response.data.title,
                    memoContent: response.data.content,
                    isGeneratingExample: false,
                })
                toast.success('Example generated!')
            } else {
                throw new Error('Invalid response from server')
            }
        } catch (error) {
            toast.error('Failed to generate example')
            console.error(error)
            set({ isGeneratingExample: false })
        }
    },

    pollMemoProcessing: (memoUuid: string) => {
        const { currentProject } = useProjectStore.getState()

        if (!currentProject || pollingInterval) return

        const checkProcessingStatus = async () => {
            try {
                const response = await api.get<{ processing_status: string }>(
                    `/v1/memo/${memoUuid}/?project_id=${currentProject.uuid}`
                )

                if (response.error) {
                    console.error('Error fetching memo status:', response.error)
                    return
                }

                const status = response.data?.processing_status

                if (status === 'processed') {
                    set({
                        processingStage: 'complete',
                        isProcessing: false,
                    })
                    get().stopPolling()
                    // Fetch chat suggestions in background
                    get().fetchChatSuggestions(memoUuid)
                } else if (status === 'error') {
                    set({
                        processingStage: 'error',
                        isProcessing: false,
                    })
                    get().stopPolling()
                    toast.error('Memo processing failed')
                } else if (status === 'processing') {
                    // Cycle through stages for visual effect
                    const stages: Array<'chunking' | 'embedding' | 'indexing'> = ['chunking', 'embedding', 'indexing']
                    const currentStageIndex = stages.indexOf(get().processingStage as any)
                    const nextStageIndex = (currentStageIndex + 1) % stages.length
                    set({ processingStage: stages[nextStageIndex] })
                }
            } catch (error) {
                console.error('Error polling memo status:', error)
            }
        }

        // Check immediately
        checkProcessingStatus()

        // Then poll every 2 seconds
        pollingInterval = setInterval(checkProcessingStatus, 2000)
    },

    stopPolling: () => {
        if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
        }
    },

    fetchChatSuggestions: async (memoUuid: string) => {
        const { currentProject } = useProjectStore.getState()

        if (!currentProject) return

        set({ isLoadingSuggestions: true })

        try {
            const response = await api.get<{ suggestions: string[] }>(
                `/onboarding/suggestions?memo_uuid=${memoUuid}&project_id=${currentProject.uuid}`
            )

            if (response.error) {
                throw new Error(response.error)
            }

            const suggestions = response.data?.suggestions || FALLBACK_SUGGESTIONS

            set({
                chatSuggestions: suggestions,
                isLoadingSuggestions: false,
            })
        } catch (error) {
            console.error('Error fetching chat suggestions:', error)
            set({
                chatSuggestions: FALLBACK_SUGGESTIONS,
                isLoadingSuggestions: false,
            })
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
        get().stopPolling()
        set({
            currentStep: 1,
            apiKey: null,
            isGeneratingApiKey: false,
            memoTitle: '',
            memoContent: '',
            isCreatingMemo: false,
            memoCreated: false,
            memoUuid: null,
            isProcessing: false,
            processingStage: 'idle',
            selectedFile: null,
            isUploadingFile: false,
            isGeneratingExample: false,
            chatQuery: '',
            chatMessages: [],
            isChatting: false,
            hasChatted: false,
            chatSuggestions: [],
            isLoadingSuggestions: false,
            searchQuery: '',
            searchResults: [],
            isSearching: false,
            hasSearched: false,
        })
    },
}))
