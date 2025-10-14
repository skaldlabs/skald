import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'
import type { Project } from '@/lib/types'

interface DeleteProjectDialogProps {
    project: Project
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirmDelete: () => Promise<void>
}

export const DeleteProjectDialog = ({ project, open, onOpenChange, onConfirmDelete }: DeleteProjectDialogProps) => {
    const [confirmText, setConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    const expectedText = `delete ${project.name}`
    const isConfirmTextValid = confirmText.toLowerCase() === expectedText.toLowerCase()

    const handleDelete = async () => {
        if (!isConfirmTextValid) return

        setIsDeleting(true)
        try {
            await onConfirmDelete()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to delete project:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isDeleting) {
            setConfirmText('')
            onOpenChange(newOpen)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <DialogTitle>Delete Project</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        This action cannot be undone. This will permanently delete the project{' '}
                        <strong>{project.name}</strong> and all associated data including:
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                        <li>All memos</li>
                        <li>All memo chunks and embeddings</li>
                        <li>All tags and summaries</li>
                        <li>Project API keys</li>
                    </ul>

                    <div className="space-y-2 mb-2">
                        <label htmlFor="confirm-text" className="text-sm font-medium">
                            Type <span className="font-mono text-destructive">{expectedText}</span> to confirm:
                        </label>
                        <Input
                            id="confirm-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={expectedText}
                            disabled={isDeleting}
                            autoComplete="off"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={!isConfirmTextValid || isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
