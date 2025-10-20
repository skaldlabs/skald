import { create } from 'zustand'

interface UpgradePromptState {
    open: boolean
    message: string
    currentUsage?: number
    limit?: number
    showPrompt: (message: string, currentUsage?: number, limit?: number) => void
    hidePrompt: () => void
}

export const useUpgradePromptStore = create<UpgradePromptState>((set) => ({
    open: false,
    message: '',
    currentUsage: undefined,
    limit: undefined,
    showPrompt: (message: string, currentUsage?: number, limit?: number) => {
        set({
            open: true,
            message,
            currentUsage,
            limit,
        })
    },
    hidePrompt: () => {
        set({
            open: false,
            message: '',
            currentUsage: undefined,
            limit: undefined,
        })
    },
}))
