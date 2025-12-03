import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { Trash2 } from 'lucide-react'
import { DeleteProjectDialog } from '@/components/Project/DeleteProjectDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Project } from '@/lib/types'

interface ProjectDangerZoneProps {
    project: Project
}

export const ProjectDangerZone = ({ project }: ProjectDangerZoneProps) => {
    const deleteProject = useProjectStore((state) => state.deleteProject)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const navigate = useNavigate()

    const handleDeleteProject = async () => {
        await deleteProject(project.uuid)
        navigate('/projects/memos')
    }

    return (
        <>
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium mb-1">Delete this project</h3>
                            <p className="text-sm text-muted-foreground">
                                Once you delete a project, there is no going back. All data will be permanently deleted.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="ml-4 shrink-0"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <DeleteProjectDialog
                project={project}
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirmDelete={handleDeleteProject}
            />
        </>
    )
}
