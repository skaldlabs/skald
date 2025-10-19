import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface UpgradePromptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    message?: string
    currentUsage?: number
    limit?: number
}

export const UpgradePromptDialog = ({
    open,
    onOpenChange,
    message = 'You have reached your usage limit',
    currentUsage,
    limit,
}: UpgradePromptDialogProps) => {
    const navigate = useNavigate()

    const handleUpgrade = () => {
        navigate('/organization/subscription')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <DialogTitle>Usage Limit Reached</DialogTitle>
                    </div>
                    <DialogDescription className="space-y-2">
                        <p>{message}</p>
                        {currentUsage !== undefined && limit !== undefined && (
                            <p className="font-semibold">
                                Current usage: {currentUsage} / {limit}
                            </p>
                        )}
                        <p className="mt-2">Upgrade your plan to continue using this feature and get higher limits.</p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpgrade}>View Plans</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
