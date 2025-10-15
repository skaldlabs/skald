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

        console.log('Starting chat stream with:', {
            query: query.trim(),
            project_id: currentProject.uuid,
            stream: true,
        })

        api.stream(
            '/v1/chat/',
            {
                query: query.trim(),
                project_id: currentProject.uuid,
                stream: true,
            },
            (data: ApiStreamData) => {
                console.log('Received stream data:', data)
                if (data.type === 'token' && data.content) {
                    const currentContent = get().messages.find((m) => m.id === assistantMessageId)?.content || ''
                    get().updateStreamingMessage(assistantMessageId, currentContent + data.content)
                } else if (data.type === 'done') {
                    console.log('Stream completed')
                    get().finishStreaming(assistantMessageId)
                } else if (data.type === 'error') {
                    console.log('Stream error:', data.content)
                    get().finishStreaming(assistantMessageId)
                    get().updateStreamingMessage(assistantMessageId, `Error: ${data.content || 'An error occurred'}`)
                } else {
                    console.log('Unknown stream data type:', data.type, data)
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
        set({ messages: [] })
    },
}))
