import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface EditProjectModalProps {
    isOpen: boolean
    onClose: () => void
    project: Project | null
}

export const EditProjectModal = ({ isOpen, onClose, project }: EditProjectModalProps) => {
    const updateProject = useProjectStore((state) => state.updateProject)
    const [editProjectName, setEditProjectName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (project) {
            setEditProjectName(project.name)
        }
    }, [project])

    const handleUpdateProject = async () => {
        if (!project || !editProjectName.trim()) {
            return
        }

        setIsSubmitting(true)
        await updateProject(project.uuid, editProjectName.trim())
        setIsSubmitting(false)

        onClose()
        setEditProjectName('')
    }

    const handleClose = () => {
        onClose()
        setEditProjectName('')
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
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
                    <Button variant="outline" onClick={handleClose}>
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
    )
}
