import type { Memo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface DeleteMemoDialogProps {
    memo: Memo | null
    deleting: boolean
    onConfirm: () => void
    onCancel: () => void
}

export const DeleteMemoDialog = ({ memo, deleting, onConfirm, onCancel }: DeleteMemoDialogProps) => {
    return (
        <Dialog open={!!memo} onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Memo</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{memo?.title}"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
