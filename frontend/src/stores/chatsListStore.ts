import { create } from 'zustand'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Chat, DetailedChat } from '@/lib/types'
import { useProjectStore } from './projectStore'

interface PaginatedResponse<T> {
    count: number
    results: T[]
    page: number
    page_size: number
    total_pages: number
}

interface ChatsListState {
    chats: Chat[]
    loading: boolean
    error: string | null
    totalCount: number
    currentPage: number
    pageSize: number
    selectedChat: DetailedChat | null
    loadingChatDetails: boolean
    fetchChats: (page?: number, pageSize?: number) => Promise<void>
    getChatDetails: (chatUuid: string) => Promise<void>
    clearSelectedChat: () => void
}

export const useChatsListStore = create<ChatsListState>((set) => ({
    chats: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    selectedChat: null,
    loadingChatDetails: false,

    fetchChats: async (page = 1, pageSize = 20) => {
        set({ loading: true, error: null })
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }
        try {
            const response = await api.get<PaginatedResponse<Chat>>(
                `/v1/chat/?page=${page}&page_size=${pageSize}&project_id=${currentProject.uuid}`
            )

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch chats'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch chats: ${errorMsg}`)
                return
            }

            set({
                chats: response.data.results,
                totalCount: response.data.count,
                currentPage: page,
                pageSize: pageSize,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch chats'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch chats: ${errorMsg}`)
        }
    },

    getChatDetails: async (chatUuid: string) => {
        set({ loadingChatDetails: true })
        const currentProject = useProjectStore.getState().currentProject
        if (!currentProject) {
            throw new Error('No project selected')
        }

        try {
            const response = await api.get<DetailedChat>(`/v1/chat/${chatUuid}/?project_id=${currentProject.uuid}`)

            if (response.error || !response.data) {
                toast.error(`Failed to fetch chat details: ${response.error}`)
                set({ loadingChatDetails: false })
                return
            }

            set({
                selectedChat: response.data,
                loadingChatDetails: false,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch chat details'
            toast.error(`Failed to fetch chat details: ${errorMsg}`)
            set({ loadingChatDetails: false })
        }
    },

    clearSelectedChat: () => {
        set({ selectedChat: null })
    },
}))
