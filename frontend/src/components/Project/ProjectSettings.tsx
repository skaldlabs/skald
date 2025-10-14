import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2, Trash2 } from 'lucide-react'
import { ApiKeyManager } from '@/components/Project/ApiKeyManager'
import { DeleteProjectDialog } from '@/components/Project/DeleteProjectDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const ProjectSettings = () => {
    const projects = useProjectStore((state) => state.projects)
    const currentProject = useProjectStore((state) => state.currentProject)
    const deleteProject = useProjectStore((state) => state.deleteProject)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const navigate = useNavigate()

    console.log('currentProject', currentProject)
    console.log('projects', projects)

    if (!currentProject) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const handleDeleteProject = async () => {
        await deleteProject(currentProject.uuid)
        // Navigate to getting started page after successful deletion
        navigate('/projects/get-started')
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">Project Settings</h1>
                <p className="text-muted-foreground">{currentProject.name}</p>
            </div>

            <div className="space-y-6">
                <ApiKeyManager project={currentProject} />

                {/* Danger Zone */}
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
                                    Once you delete a project, there is no going back. All data will be permanently
                                    deleted.
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
            </div>

            <DeleteProjectDialog
                project={currentProject}
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirmDelete={handleDeleteProject}
            />
        </div>
    )
}
