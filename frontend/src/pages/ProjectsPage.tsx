import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Folder, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { useProjectStore } from '@/stores/projectStore'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export const ProjectsPage = () => {
    const navigate = useNavigate()

    const projects = useProjectStore((state) => state.projects)
    const loading = useProjectStore((state) => state.loading)
    const fetchProjects = useProjectStore((state) => state.fetchProjects)
    const createProject = useProjectStore((state) => state.createProject)
    const updateProject = useProjectStore((state) => state.updateProject)
    const deleteProject = useProjectStore((state) => state.deleteProject)
    const setCurrentProject = useProjectStore((state) => state.setCurrentProject)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [newProjectName, setNewProjectName] = useState('')
    const [editProjectName, setEditProjectName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            return
        }

        setIsSubmitting(true)
        const newProject = await createProject(newProjectName.trim())
        setIsSubmitting(false)

        if (newProject) {
            setIsCreateModalOpen(false)
            setNewProjectName('')
            navigate('/dashboard')
        }
    }

    const handleEditProject = (project: Project) => {
        setEditingProject(project)
        setEditProjectName(project.name)
        setIsEditModalOpen(true)
    }

    const handleUpdateProject = async () => {
        if (!editingProject || !editProjectName.trim()) {
            return
        }

        setIsSubmitting(true)
        await updateProject(editingProject.uuid, editProjectName.trim())
        setIsSubmitting(false)

        setIsEditModalOpen(false)
        setEditingProject(null)
        setEditProjectName('')
    }

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project)
        setDeleteDialogOpen(true)
    }

    const confirmDeleteProject = async () => {
        if (projectToDelete) {
            await deleteProject(projectToDelete.uuid)
            setDeleteDialogOpen(false)
            setProjectToDelete(null)
        }
    }

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project)
        navigate('/dashboard')
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
                                                handleEditProject(project)
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
                                                handleDeleteProject(project)
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
                )}

                {/* Create Project Dialog */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="project-name">Project Name</Label>
                                <Input
                                    id="project-name"
                                    placeholder="Enter project name"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newProjectName.trim()) {
                                            handleCreateProject()
                                        }
                                    }}
                                    maxLength={255}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setNewProjectName('')
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateProject} disabled={!newProjectName.trim() || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Project Dialog */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-project-name">Project Name</Label>
                                <Input
                                    id="edit-project-name"
                                    placeholder="Enter project name"
                                    value={editProjectName}
                                    onChange={(e) => setEditProjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editProjectName.trim()) {
                                            handleUpdateProject()
                                        }
                                    }}
                                    maxLength={255}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false)
                                    setEditingProject(null)
                                    setEditProjectName('')
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateProject} disabled={!editProjectName.trim() || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Project</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeleteDialogOpen(false)
                                    setProjectToDelete(null)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDeleteProject}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}
