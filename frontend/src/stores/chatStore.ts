import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from 'sonner'
import type { ApiStreamData, ApiErrorData, MemoFilter } from '@/lib/types'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    isStreaming?: boolean
    references?: Record<number, { memo_uuid: string; memo_title: string }>
}

export interface RagConfig {
    queryRewriteEnabled: boolean
    rerankingEnabled: boolean
    vectorSearchTopK: number
    similarityThreshold: number
    rerankingTopK: number
    referencesEnabled: boolean
}

export interface ScopeEntry {
    id: string
    key: string
    value: string
}

interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
    isStreaming: boolean
    currentStreamingMessageId: string | null
    systemPrompt: string
    llmProvider: string
    ragConfig: RagConfig
    filters: MemoFilter[]
    scopes: ScopeEntry[]
    chatSessionId: string | null
    setSystemPrompt: (prompt: string) => void
    setLlmProvider: (provider: string) => void
    setRagConfig: (config: Partial<RagConfig>) => void
    setFilters: (filters: MemoFilter[]) => void
    addFilter: (filter: Omit<MemoFilter, 'id'>) => void
    updateFilter: (id: string, filter: Partial<Omit<MemoFilter, 'id'>>) => void
    removeFilter: (id: string) => void
    setScopes: (scopes: ScopeEntry[]) => void
    addScope: (key: string, value: string) => void
    updateScope: (id: string, key: string, value: string) => void
    removeScope: (id: string) => void
    sendMessage: (query: string) => Promise<void>
    clearMessages: () => void
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string }) => void
    updateStreamingMessage: (messageId: string, content: string) => void
    setMessageReferences: (
        messageId: string,
        references: Record<number, { memo_uuid: string; memo_title: string }>
    ) => void
    finishStreaming: (messageId: string) => void
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [],
            isLoading: false,
            isStreaming: false,
            currentStreamingMessageId: null,
            systemPrompt: '',
            llmProvider: '',
            ragConfig: {
                queryRewriteEnabled: false,
                rerankingEnabled: true,
                vectorSearchTopK: 50,
                similarityThreshold: 0.8,
                rerankingTopK: 25,
                referencesEnabled: false,
            },
            filters: [],
            scopes: [],
            chatSessionId: null,

            setSystemPrompt: (prompt: string) => {
                set({ systemPrompt: prompt })
            },

            setLlmProvider: (provider: string) => {
                set({ llmProvider: provider })
            },

            setRagConfig: (config: Partial<RagConfig>) => {
                set((state) => ({
                    ragConfig: { ...state.ragConfig, ...config },
                }))
            },

            setFilters: (filters: MemoFilter[]) => {
                set({ filters })
            },

            addFilter: (filter: Omit<MemoFilter, 'id'>) => {
                const newFilter: MemoFilter = {
                    ...filter,
                    id: crypto.randomUUID(),
                }
                set((state) => ({
                    filters: [...state.filters, newFilter],
                }))
            },

            updateFilter: (id: string, filter: Partial<Omit<MemoFilter, 'id'>>) => {
                set((state) => ({
                    filters: state.filters.map((f) => (f.id === id ? { ...f, ...filter } : f)),
                }))
            },

            removeFilter: (id: string) => {
                set((state) => ({
                    filters: state.filters.filter((f) => f.id !== id),
                }))
            },

            setScopes: (scopes: ScopeEntry[]) => {
                set({ scopes })
            },

            addScope: (key: string, value: string) => {
                const newScope: ScopeEntry = {
                    id: crypto.randomUUID(),
                    key,
                    value,
                }
                set((state) => ({
                    scopes: [...state.scopes, newScope],
                }))
            },

            updateScope: (id: string, key: string, value: string) => {
                set((state) => ({
                    scopes: state.scopes.map((s) => (s.id === id ? { ...s, key, value } : s)),
                }))
            },

            removeScope: (id: string) => {
                set((state) => ({
                    scopes: state.scopes.filter((s) => s.id !== id),
                }))
            },

            addMessage: (message) => {
                const newMessage: ChatMessage = {
                    ...message,
                    id: message.id || crypto.randomUUID(),
                    timestamp: new Date(),
                }
                set((state) => ({
                    messages: [...state.messages, newMessage],
                }))
            },

            updateStreamingMessage: (messageId, content) => {
                set((state) => ({
                    messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)),
                }))
            },

            setMessageReferences: (messageId, references) => {
                set((state) => ({
                    messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, references } : msg)),
                }))
            },

            finishStreaming: (messageId) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isStreaming: false } : msg
                    ),
                    isStreaming: false,
                    currentStreamingMessageId: null,
                }))
            },

            sendMessage: async (query: string) => {
                const currentProject = useProjectStore.getState().currentProject
                if (!currentProject) {
                    toast.error('No project selected')
                    return
                }

                if (!query.trim()) {
                    return
                }

                get().addMessage({
                    role: 'user',
                    content: query.trim(),
                })

                set({ isLoading: true, isStreaming: true })

                const assistantMessageId = crypto.randomUUID()
                get().addMessage({
                    id: assistantMessageId,
                    role: 'assistant',
                    content: '',
                    isStreaming: true,
                })

                set({ currentStreamingMessageId: assistantMessageId })

                const payload: Record<string, unknown> = {
                    query: query.trim(),
                    project_id: currentProject.uuid,
                    stream: true,
                }

                const systemPrompt = get().systemPrompt.trim()
                if (systemPrompt) {
                    payload.system_prompt = systemPrompt
                }

                const chatSessionId = get().chatSessionId
                if (chatSessionId) {
                    payload.chat_id = chatSessionId
                }

                // Include RAG config
                const ragConfig = get().ragConfig
                const llmProvider = get().llmProvider
                payload.rag_config = {
                    llm_provider: llmProvider,
                    query_rewrite: { enabled: ragConfig.queryRewriteEnabled },
                    reranking: { enabled: ragConfig.rerankingEnabled, top_k: ragConfig.rerankingTopK },
                    vector_search: {
                        top_k: ragConfig.vectorSearchTopK,
                        similarity_threshold: ragConfig.similarityThreshold,
                    },
                    references: { enabled: ragConfig.referencesEnabled },
                }

                // Include filters (strip frontend-only id field)
                const filters = get().filters
                const scopes = get().scopes

                // Combine regular filters with scope filters
                const allFilters = [
                    ...filters.map(({ field, operator, value, filter_type }) => ({
                        field,
                        operator,
                        value,
                        filter_type,
                    })),
                    ...scopes
                        .filter((s) => s.key.trim() && s.value.trim())
                        .map((s) => ({
                            field: s.key,
                            operator: 'eq' as const,
                            value: s.value,
                            filter_type: 'scope' as const,
                        })),
                ]

                if (allFilters.length > 0) {
                    payload.filters = allFilters
                }

                api.stream(
                    '/v1/chat/',
                    payload,
                    (data: ApiStreamData) => {
                        if (data.type === 'token' && data.content) {
                            const currentContent =
                                get().messages.find((m) => m.id === assistantMessageId)?.content || ''
                            get().updateStreamingMessage(assistantMessageId, currentContent + data.content)
                        } else if (data.type === 'references' && data.content) {
                            try {
                                const references = JSON.parse(data.content)
                                get().setMessageReferences(assistantMessageId, references)
                            } catch (error) {
                                console.error('Failed to parse references:', error)
                            }
                        } else if (data.type === 'done') {
                            get().finishStreaming(assistantMessageId)
                            if ('chat_id' in data && typeof data.chat_id === 'string') {
                                set({ chatSessionId: data.chat_id })
                            }
                        } else if (data.type === 'error') {
                            get().finishStreaming(assistantMessageId)
                            get().updateStreamingMessage(
                                assistantMessageId,
                                `Error: ${data.content || 'An error occurred'}`
                            )
                        }
                    },
                    (error: ApiErrorData | Event) => {
                        console.error('Chat stream error:', error)
                        get().finishStreaming(assistantMessageId)

                        // Extract error message from ApiErrorData or use generic message
                        const errorMessage =
                            'error' in error && typeof error.error === 'string' ? error.error : 'Failed to get response'

                        get().updateStreamingMessage(assistantMessageId, `Error: ${errorMessage}`)
                        toast.error(errorMessage)
                    }
                )

                set({ isLoading: false })
            },

            clearMessages: () => {
                set({ messages: [], chatSessionId: null })
            },
        }),
        {
            name: 'playground-settings',
            partialize: (state) => ({
                systemPrompt: state.systemPrompt,
                llmProvider: state.llmProvider,
                ragConfig: state.ragConfig,
                filters: state.filters,
                scopes: state.scopes,
            }),
        }
    )
)
