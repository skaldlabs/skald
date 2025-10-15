import type { DetailedMemo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DetailedMemoView } from './DetailedMemoView'

interface ViewMemoDialogProps {
    memo: DetailedMemo | null
    onClose: () => void
}

export const ViewMemoDialog = ({ memo, onClose }: ViewMemoDialogProps) => {
    return (
        <Dialog open={!!memo} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Memo Details</DialogTitle>
                    <DialogDescription>Complete information for this memo</DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4">{memo && <DetailedMemoView memo={memo} />}</div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
