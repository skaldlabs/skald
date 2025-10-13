import { Folder, Edit, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectListProps {
    onEditProject: (project: Project) => void
    onDeleteProject: (project: Project) => void
}

export const ProjectList = ({ onEditProject, onDeleteProject }: ProjectListProps) => {
    const navigate = useNavigate()
    const projects = useProjectStore((state) => state.projects)
    const setCurrentProject = useProjectStore((state) => state.setCurrentProject)

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project)
        navigate(`/projects/${project.uuid}/memos`)
    }

    if (projects.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Folder className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                        No projects yet. Create your first project to get started.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
                <Card
                    key={project.uuid}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectProject(project)}
                >
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Folder className="h-8 w-8 text-primary" />
                                <div>
                                    <CardTitle>{project.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Created {new Date(project.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEditProject(project)
                                }}
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteProject(project)
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
