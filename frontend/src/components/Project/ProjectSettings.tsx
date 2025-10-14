import { useProjectStore } from '@/stores/projectStore'
import { Loader2 } from 'lucide-react'
import { ProjectEditor } from '@/components/Project/ProjectEditor'
import { ApiKeyManager } from '@/components/Project/ApiKeyManager'
import { ProjectDangerZone } from '@/components/Project/ProjectDangerZone'

export const ProjectSettings = () => {
    const currentProject = useProjectStore((state) => state.currentProject)

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
            </div>

            <div className="space-y-6">
                <ApiKeyManager project={currentProject} />
                <ProjectEditor project={currentProject} />
                <ProjectDangerZone project={currentProject} />
            </div>
        </div>
    )
}
