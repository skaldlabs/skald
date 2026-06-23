import { create } from 'zustand'
import { api, getProjectPath } from '@/lib/api'
import { toast } from 'sonner'

export interface EvaluationDataset {
    uuid: string
    name: string
    description: string
    created_at: string
}

export interface EvaluationDatasetQuestion {
    uuid: string
    question: string
    answer: string
    created_at: string
}

export interface EvaluationDatasetDetail extends EvaluationDataset {
    questions: EvaluationDatasetQuestion[]
}

interface CreateDatasetPayload extends Record<string, unknown> {
    name: string
    description: string
    questions: {
        question: string
        answer: string
    }[]
}

interface UpdateQuestionPayload extends Record<string, unknown> {
    question: string
    answer: string
}

interface EvaluateDatasetsState {
    datasets: EvaluationDataset[]
    currentDataset: EvaluationDatasetDetail | null
    loading: boolean
    error: string | null
    fetchDatasets: () => Promise<void>
    fetchDataset: (datasetUuid: string) => Promise<void>
    createDataset: (payload: CreateDatasetPayload) => Promise<boolean>
    updateQuestion: (datasetUuid: string, questionUuid: string, payload: UpdateQuestionPayload) => Promise<boolean>
    deleteDataset: (datasetUuid: string) => Promise<boolean>
    clearCurrentDataset: () => void
}

export const useEvaluateDatasetsStore = create<EvaluateDatasetsState>((set, get) => ({
    datasets: [],
    currentDataset: null,
    loading: false,
    error: null,

    fetchDatasets: async () => {
        set({ loading: true, error: null })
        try {
            const projectPath = getProjectPath()
            const response = await api.get<EvaluationDataset[]>(`${projectPath}/evaluation-datasets`)

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch datasets'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch datasets: ${errorMsg}`)
                return
            }

            set({
                datasets: response.data,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch datasets'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch datasets: ${errorMsg}`)
        }
    },

    fetchDataset: async (datasetUuid: string) => {
        set({ loading: true, error: null })
        try {
            const projectPath = getProjectPath()
            const response = await api.get<EvaluationDatasetDetail>(`${projectPath}/evaluation-datasets/${datasetUuid}`)

            if (response.error || !response.data) {
                const errorMsg = response.error || 'Failed to fetch dataset'
                set({ loading: false, error: errorMsg })
                toast.error(`Failed to fetch dataset: ${errorMsg}`)
                return
            }

            set({
                currentDataset: response.data,
                loading: false,
                error: null,
            })
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch dataset'
            set({ loading: false, error: errorMsg })
            toast.error(`Failed to fetch dataset: ${errorMsg}`)
        }
    },

    createDataset: async (payload: CreateDatasetPayload) => {
        try {
            const projectPath = getProjectPath()
            const response = await api.post<EvaluationDataset>(`${projectPath}/evaluation-datasets`, payload)

            if (response.error) {
                toast.error(`Failed to create dataset: ${response.error}`)
                return false
            }

            await get().fetchDatasets()
            toast.success('Dataset created successfully')
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to create dataset'
            toast.error(`Failed to create dataset: ${errorMsg}`)
            return false
        }
    },

    updateQuestion: async (datasetUuid: string, questionUuid: string, payload: UpdateQuestionPayload) => {
        try {
            const projectPath = getProjectPath()
            const response = await api.patch<EvaluationDatasetQuestion>(
                `${projectPath}/evaluation-datasets/${datasetUuid}/questions/${questionUuid}`,
                payload
            )

            if (response.error) {
                toast.error(`Failed to update question: ${response.error}`)
                return false
            }

            // Refresh current dataset if it matches
            if (get().currentDataset?.uuid === datasetUuid) {
                await get().fetchDataset(datasetUuid)
            }

            toast.success('Question updated successfully')
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to update question'
            toast.error(`Failed to update question: ${errorMsg}`)
            return false
        }
    },

    deleteDataset: async (datasetUuid: string) => {
        try {
            const projectPath = getProjectPath()
            const response = await api.delete(`${projectPath}/evaluation-datasets/${datasetUuid}`)

            if (response.error) {
                toast.error(`Failed to delete dataset: ${response.error}`)
                return false
            }

            await get().fetchDatasets()
            toast.success('Dataset deleted successfully')
            return true
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to delete dataset'
            toast.error(`Failed to delete dataset: ${errorMsg}`)
            return false
        }
    },

    clearCurrentDataset: () => {
        set({ currentDataset: null })
    },
}))
