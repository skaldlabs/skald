import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface DeleteProjectModalProps {
    isOpen: boolean
    onClose: () => void
    project: Project | null
}

export const DeleteProjectModal = ({ isOpen, onClose, project }: DeleteProjectModalProps) => {
    const deleteProject = useProjectStore((state) => state.deleteProject)

    const confirmDeleteProject = async () => {
        if (project) {
            await deleteProject(project.uuid)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{project?.name}"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteProject}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
