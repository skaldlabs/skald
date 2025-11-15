import { create } from 'zustand'
import { api, getProjectPath } from '@/lib/api'
import { toast } from 'sonner'

export interface ExperimentStatistics {
    average_llm_answer_rating: number | null
    average_human_answer_rating: number | null
    average_total_answer_time_ms: number | null
    average_time_to_first_token_ms: number | null
    total_results: number
}

export interface Experiment {
    uuid: string
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
    evaluation_dataset_name: string
    statistics: ExperimentStatistics
    created_at: string
}

export interface ExperimentResult {
    uuid: string
    question: string
    expected_answer: string
    answer: string
    total_answer_time_ms?: number
    time_to_first_token_ms?: number
    llm_answer_rating?: number
    human_answer_rating?: number
    created_at: string
}

interface CreateExperimentPayload extends Record<string, unknown> {
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
}

interface RunExperimentPayload extends Record<string, unknown> {
    evaluation_dataset_question_uuid: string
}

interface EvaluateExperimentsState {
    experiments: Experiment[]
    currentExperiment: Experiment | null
    results: ExperimentResult[]
    loading: boolean
    error: string | null
    fetchExperiments: () => Promise<void>
    fetchExperiment: (experimentUuid: string) => Promise<void>
    fetchExperimentResults: (experimentUuid: string) => Promise<void>
    createExperiment: (payload: CreateExperimentPayload) => Promise<boolean>
    runExperiment: (experimentUuid: string, payload: RunExperimentPayload) => Promise<boolean>
    clearCurrentExperiment: () => void
    clearResults: () => void
}

export const useEvaluateExperimentsStore = create<EvaluateExperimentsState>((set, get) => ({
    experiments: [],
    currentExperiment: null,
    results: [],
    loading: false,
    error: null,

    fetchExperiments: async () => {
        set({ loading: true, error: null })
        try {
            const projectPath = getProjectPath()
            const response = await api.get<Experiment[]>(`${projectPath}/experiments`)

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch experiments'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch experiments: ${errorMsg}`)
                return
            }

            set({
                experiments: response.data,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch experiments'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch experiments: ${errorMsg}`)
        }
    },

    fetchExperiment: async (experimentUuid: string) => {
        set({ loading: true, error: null })
        try {
            const projectPath = getProjectPath()
            const response = await api.get<Experiment>(`${projectPath}/experiments/${experimentUuid}`)

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch experiment'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch experiment: ${errorMsg}`)
                return
            }

            set({
                currentExperiment: response.data,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch experiment'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch experiment: ${errorMsg}`)
        }
    },

    fetchExperimentResults: async (experimentUuid: string) => {
        set({ loading: true, error: null })
        try {
            const projectPath = getProjectPath()
            const response = await api.get<ExperimentResult[]>(`${projectPath}/experiments/${experimentUuid}/results`)

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch experiment results'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch experiment results: ${errorMsg}`)
                return
            }

            set({
                results: response.data,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch experiment results'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch experiment results: ${errorMsg}`)
        }
    },

    createExperiment: async (payload: CreateExperimentPayload) => {
        try {
            const projectPath = getProjectPath()
            const response = await api.post<Experiment>(`${projectPath}/experiments`, payload)

            if (response.error) {
                toast.error(`Failed to create experiment: ${response.error}`)
                return false
            }

            await get().fetchExperiments()
            toast.success('Experiment created successfully')
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to create experiment'
            toast.error(`Failed to create experiment: ${errorMsg}`)
            return false
        }
    },

    runExperiment: async (experimentUuid: string, payload: RunExperimentPayload) => {
        try {
            const projectPath = getProjectPath()
            const response = await api.post(`${projectPath}/experiments/${experimentUuid}/run`, payload)

            if (response.error) {
                toast.error(`Failed to run experiment: ${response.error}`)
                return false
            }

            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to run experiment'
            toast.error(`Failed to run experiment: ${errorMsg}`)
            return false
        }
    },

    clearCurrentExperiment: () => {
        set({ currentExperiment: null })
    },

    clearResults: () => {
        set({ results: [] })
    },
}))
