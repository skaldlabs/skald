import { useProjectStore } from '@/stores/projectStore'
import { Loader2 } from 'lucide-react'
import { ApiKeyManager } from '@/components/Project/ApiKeyManager'

export const ProjectSettings = () => {
    const projects = useProjectStore((state) => state.projects)
    const currentProject = useProjectStore((state) => state.currentProject)
    console.log('currentProject', currentProject)
    console.log('projects', projects)
    if (!currentProject) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">Project Settings</h1>
                <p className="text-muted-foreground">{currentProject.name}</p>
            </div>

            <ApiKeyManager project={currentProject} />
        </div>
    )
}
