import { useEffect } from 'react'
import { Folder, Loader2 } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const ProjectSelector = () => {
    const { projects, currentProject, loading, fetchProjects, setCurrentProject } = useProjectStore()

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleProjectChange = (projectUuid: string) => {
        const project = projects.find((p) => p.uuid === projectUuid)
        if (project) {
            setCurrentProject(project)
        }
    }

    if (loading && projects.length === 0) {
        return (
            <div className="p-4 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 space-y-2">
            <Select value={currentProject?.uuid || ''} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <SelectValue placeholder="Select a project" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {projects.map((project) => (
                        <SelectItem key={project.uuid} value={project.uuid}>
                            {project.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
