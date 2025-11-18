import { create } from 'zustand'
import { api } from '@/lib/api'

export interface LLMProvider {
    provider: 'openai' | 'anthropic' | 'groq' | 'local'
    label: string
    model: string
}

interface LLMConfigState {
    availableProviders: LLMProvider[]
    isLoading: boolean
    error: string | null
    fetchProviders: () => Promise<void>
}

export const useLLMConfigStore = create<LLMConfigState>((set) => ({
    availableProviders: [],
    isLoading: false,
    error: null,

    fetchProviders: async () => {
        set({ isLoading: true, error: null })
        const response = await api.get<{ providers: LLMProvider[] }>('/v1/config/llm-providers')

        if (response.error) {
            set({ error: response.error, isLoading: false })
            return
        }

        if (response.data) {
            set({ availableProviders: response.data.providers, isLoading: false })
        }
    },
}))
