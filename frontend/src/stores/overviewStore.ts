import { create } from 'zustand'
import { api } from '@/lib/api'
import { useProjectStore } from './projectStore'

interface ProjectStats {
    memoCount: number
    chatCount: number
}

interface OverviewResponse {
    memo_count: number
    chat_count: number
}

interface OverviewState {
    stats: ProjectStats | null
    loading: boolean
    fetchStats: (projectUuid: string) => Promise<void>
}

export const useOverviewStore = create<OverviewState>((set) => ({
    stats: null,
    loading: false,

    fetchStats: async (projectUuid: string) => {
        if (!projectUuid) return

        set({ loading: true })
        try {
            const response = await api.get<OverviewResponse>(`/project/${projectUuid}/overview/`)

            const currentProject = useProjectStore.getState().currentProject
            if (currentProject?.uuid !== projectUuid) {
                return
            }

            set({
                stats: {
                    memoCount: response.data?.memo_count ?? 0,
                    chatCount: response.data?.chat_count ?? 0,
                },
                loading: false,
            })
        } catch {
            const currentProject = useProjectStore.getState().currentProject
            if (currentProject?.uuid === projectUuid) {
                set({ stats: { memoCount: 0, chatCount: 0 }, loading: false })
            }
        }
    },
}))
