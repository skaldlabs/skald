import type { DetailedMemo } from '@/lib/types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DetailedMemoView } from './DetailedMemoView'
import { Button } from '../ui/button'
import { Share, Trash2 } from 'lucide-react'

interface ViewMemoDialogProps {
    memo: DetailedMemo | null
    onClose: () => void
    onShareMemo?: (memo: DetailedMemo) => void | Promise<void>
    onDeleteMemo?: (memo: DetailedMemo) => void | Promise<void>
    onMemoUpdated?: () => void
}

export const ViewMemoDialog = ({ memo, onClose, onShareMemo, onDeleteMemo, onMemoUpdated }: ViewMemoDialogProps) => {
    return (
        <Dialog open={!!memo} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <div className="sr-only">
                    <DialogHeader>
                        <DialogTitle>Memo Details</DialogTitle>
                        <DialogDescription>Complete information for this memo</DialogDescription>
                    </DialogHeader>
                </div>
                <div className="max-h-[80vh] overflow-y-auto">
                    {memo && <DetailedMemoView memo={memo} onMemoUpdated={onMemoUpdated} />}
                </div>
                <DialogFooter>
                    {(onShareMemo || onDeleteMemo) && (
                        <div className="flex items-center gap-2 pr-2">
                            {onShareMemo && (
                                <Button variant="outline" size="sm" onClick={() => onShareMemo?.(memo as DetailedMemo)}>
                                    <Share className="h-4 w-4 mr-1" />
                                    Share
                                </Button>
                            )}
                            {onDeleteMemo && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDeleteMemo?.(memo as DetailedMemo)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
