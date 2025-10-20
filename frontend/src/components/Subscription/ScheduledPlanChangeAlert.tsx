import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CalendarClock, X } from 'lucide-react'
import { formatDate } from '@/components/utils/dateUtils'

interface ScheduledPlanChangeAlertProps {
    scheduledPlanName: string
    scheduledChangeDate: string
    onCancelChange: () => void
    loading: boolean
}

export const ScheduledPlanChangeAlert = ({
    scheduledPlanName,
    scheduledChangeDate,
    onCancelChange,
    loading,
}: ScheduledPlanChangeAlertProps) => {
    return (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100">
            <CalendarClock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            <AlertTitle>Scheduled Plan Change</AlertTitle>
            <AlertDescription>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p>
                            Your plan will change to <strong>{scheduledPlanName}</strong> on{' '}
                            <strong>{formatDate(scheduledChangeDate)}</strong>.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            You can cancel this scheduled change at any time before it takes effect.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onCancelChange} disabled={loading}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel Change
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    )
}
