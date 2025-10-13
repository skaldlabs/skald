import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2 } from 'lucide-react'
import { ApiKeyManager } from '@/components/ApiKeyManager/ApiKeyManager'

export const ProjectSettingsPage = () => {
    const { uuid } = useParams<{ uuid: string }>()
    const navigate = useNavigate()

    const projects = useProjectStore((state) => state.projects)
    const currentProject = useProjectStore((state) => state.currentProject)
    const fetchProjects = useProjectStore((state) => state.fetchProjects)

    // Find the project by UUID from URL params
    const project = uuid ? projects.find((p) => p.uuid === uuid) : currentProject

    useEffect(() => {
        if (projects.length === 0) {
            fetchProjects()
        }
    }, [projects.length, fetchProjects])

    // Redirect if no project found
    useEffect(() => {
        if (projects.length > 0 && !project) {
            navigate('/projects')
        }
    }, [project, projects.length, navigate])

    if (!project) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="p-6 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold mb-2">Project Settings</h1>
                    <p className="text-muted-foreground">{project.name}</p>
                </div>

                <ApiKeyManager project={project} />
            </div>
        </AppLayout>
    )
}
