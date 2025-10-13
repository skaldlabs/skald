import { useEffect, useState } from 'react'
import { Plus, Folder, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProjectList } from '@/components/ProjectList/ProjectList'
import { CreateProjectModal } from '@/components/CreateProjectModal/CreateProjectModal'
import { EditProjectModal } from '@/components/EditProjectModal/EditProjectModal'
import { DeleteProjectModal } from '@/components/DeleteProjectModal/DeleteProjectModal'

export const ProjectsPage = () => {
    const projects = useProjectStore((state) => state.projects)
    const loading = useProjectStore((state) => state.loading)
    const fetchProjects = useProjectStore((state) => state.fetchProjects)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleEditProject = (project: Project) => {
        setEditingProject(project)
        setIsEditModalOpen(true)
    }

    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project)
        setDeleteDialogOpen(true)
    }

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false)
        setEditingProject(null)
    }

    const handleCloseDeleteModal = () => {
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
    }

    if (loading && projects.length === 0) {
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
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Projects</h1>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </Button>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Folder className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No projects yet. Create your first project to get started.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Project
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <ProjectList onEditProject={handleEditProject} onDeleteProject={handleDeleteProject} />
                )}

                <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
                <EditProjectModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} project={editingProject} />
                <DeleteProjectModal
                    isOpen={deleteDialogOpen}
                    onClose={handleCloseDeleteModal}
                    project={projectToDelete}
                />
            </div>
        </AppLayout>
    )
}
