import { create } from 'zustand'
import { api, getOrgPath } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type { Project } from '@/lib/types'

const CURRENT_PROJECT_KEY = 'skald_current_project_uuid'

interface ProjectState {
    projects: Project[]
    currentProject: Project | null
    loading: boolean
    error: string | null
    fetchProjects: () => Promise<void>
    createProject: (name: string) => Promise<Project | null>
    updateProject: (uuid: string, name: string) => Promise<void>
    deleteProject: (uuid: string) => Promise<void>
    setCurrentProject: (project: Project | null) => void
    initializeCurrentProject: () => Promise<void>
    generateApiKey: (projectUuid: string) => Promise<string | null>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,

    fetchProjects: async () => {
        set({ loading: true, error: null })

        const response = await api.get<Project[]>(`${getOrgPath()}/projects/`)
        console.log('response', response)
        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch projects',
            })
            return
        }

        set({
            projects: response.data,
            loading: false,
            error: null,
        })

        // Initialize current project if not set
        await get().initializeCurrentProject()
    },

    createProject: async (name: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            toast.error('No organization selected')
            return null
        }

        set({ loading: true, error: null })

        const response = await api.post<Project>(`${getOrgPath()}/projects/`, {
            name,
            organization: organizationId,
        })

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to create project',
            })
            toast.error(`Failed to create project: ${response.error}`)
            return null
        }

        const newProject = response.data

        set((state) => ({
            projects: [...state.projects, newProject],
            loading: false,
            error: null,
        }))

        toast.success('Project created successfully')

        // Set as current project
        get().setCurrentProject(newProject)

        return newProject
    },

    updateProject: async (uuid: string, name: string) => {
        set({ loading: true, error: null })

        const response = await api.put(`${getOrgPath()}/projects/${uuid}/`, {
            name,
        })

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to update project: ${response.error}`)
            return
        }

        set((state) => ({
            projects: state.projects.map((p) => (p.uuid === uuid ? { ...p, name } : p)),
            currentProject:
                state.currentProject?.uuid === uuid ? { ...state.currentProject, name } : state.currentProject,
            loading: false,
            error: null,
        }))

        toast.success('Project updated successfully')
    },

    deleteProject: async (uuid: string) => {
        set({ loading: true, error: null })

        const response = await api.delete(`${getOrgPath()}/projects/${uuid}/`)

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to delete project: ${response.error}`)
            return
        }

        set((state) => ({
            projects: state.projects.filter((p) => p.uuid !== uuid),
            currentProject: state.currentProject?.uuid === uuid ? null : state.currentProject,
            loading: false,
            error: null,
        }))

        // Clear from localStorage if it was the current project
        const storedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY)
        if (storedProjectId === uuid) {
            localStorage.removeItem(CURRENT_PROJECT_KEY)
        }

        toast.success('Project deleted successfully')
    },

    setCurrentProject: (project: Project | null) => {
        set({ currentProject: project })
        if (project) {
            localStorage.setItem(CURRENT_PROJECT_KEY, project.uuid)
        } else {
            localStorage.removeItem(CURRENT_PROJECT_KEY)
        }
    },

    initializeCurrentProject: async () => {
        const state = get()

        // If current project is already set, do nothing
        if (state.currentProject) {
            return
        }

        // Try to load from localStorage
        const storedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY)
        if (storedProjectId && state.projects.length > 0) {
            const project = state.projects.find((p) => p.uuid === storedProjectId)
            if (project) {
                set({ currentProject: project })
                return
            }
        }

        // If no stored project or it doesn't exist, set the first project as current
        if (state.projects.length > 0) {
            get().setCurrentProject(state.projects[0])
        }
    },

    generateApiKey: async (projectUuid: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            toast.error('No organization selected')
            return null
        }

        const response = await api.post<{ api_key: string }>(
            `${getOrgPath()}/projects/${projectUuid}/generate_api_key/`
        )

        if (response.error || !response.data) {
            toast.error(`Failed to generate API key: ${response.error}`)
            return null
        }

        // Fetch projects to update the has_api_key and first_12_digits fields
        await get().fetchProjects()

        toast.success('API key generated successfully')
        return response.data.api_key
    },
}))
