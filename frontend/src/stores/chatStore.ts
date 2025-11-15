import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from 'sonner'
import type { ApiStreamData, ApiErrorData } from '@/lib/types'

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

interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
    isStreaming: boolean
    currentStreamingMessageId: string | null
    systemPrompt: string
    llmProvider: string
    ragConfig: RagConfig
    chatSessionId: string | null
    setSystemPrompt: (prompt: string) => void
    setLlmProvider: (provider: string) => void
    setRagConfig: (config: Partial<RagConfig>) => void
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
            llmProvider: 'openai',
            ragConfig: {
                queryRewriteEnabled: false,
                rerankingEnabled: true,
                vectorSearchTopK: 100,
                similarityThreshold: 0.8,
                rerankingTopK: 50,
                referencesEnabled: false,
            },
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
            }),
        }
    )
)
