import { create } from 'zustand'
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
}

interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
    isStreaming: boolean
    currentStreamingMessageId: string | null
    systemPrompt: string
    chatSessionId: string | null
    setSystemPrompt: (prompt: string) => void
    sendMessage: (query: string) => Promise<void>
    clearMessages: () => void
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string }) => void
    updateStreamingMessage: (messageId: string, content: string) => void
    finishStreaming: (messageId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isLoading: false,
    isStreaming: false,
    currentStreamingMessageId: null,
    systemPrompt: '',
    chatSessionId: null,

    setSystemPrompt: (prompt: string) => {
        set({ systemPrompt: prompt })
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

    finishStreaming: (messageId) => {
        set((state) => ({
            messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg)),
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

        api.stream(
            '/v1/chat/',
            payload,
            (data: ApiStreamData) => {
                if (data.type === 'token' && data.content) {
                    const currentContent = get().messages.find((m) => m.id === assistantMessageId)?.content || ''
                    get().updateStreamingMessage(assistantMessageId, currentContent + data.content)
                } else if (data.type === 'done') {
                    get().finishStreaming(assistantMessageId)
                    if ('chat_id' in data && typeof data.chat_id === 'string') {
                        set({ chatSessionId: data.chat_id })
                    }
                } else if (data.type === 'error') {
                    get().finishStreaming(assistantMessageId)
                    get().updateStreamingMessage(assistantMessageId, `Error: ${data.content || 'An error occurred'}`)
                }
            },
            (error: ApiErrorData | Event) => {
                console.error('Chat stream error:', error)
                get().finishStreaming(assistantMessageId)
                get().updateStreamingMessage(assistantMessageId, 'Error: Failed to get response')
                toast.error('Failed to send message')
            }
        )

        set({ isLoading: false })
    },

    clearMessages: () => {
        set({ messages: [], chatSessionId: null })
    },
}))
