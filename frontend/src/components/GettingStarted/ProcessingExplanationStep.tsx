import { useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ProcessingExplanationStep = () => {
    const processingStage = useOnboardingStore((state) => state.processingStage)
    const memoUuid = useOnboardingStore((state) => state.memoUuid)
    const pollMemoProcessing = useOnboardingStore((state) => state.pollMemoProcessing)
    const stopPolling = useOnboardingStore((state) => state.stopPolling)
    const nextStep = useOnboardingStore((state) => state.nextStep)

    // Start polling when component mounts
    useEffect(() => {
        if (memoUuid && processingStage !== 'complete' && processingStage !== 'error') {
            pollMemoProcessing(memoUuid)
        }

        return () => {
            stopPolling()
        }
    }, [memoUuid, processingStage, pollMemoProcessing, stopPolling])

    const stages = [
        {
            id: 'chunking',
            title: 'Breaking into chunks',
            description: 'We split your content into digestible pieces for better retrieval',
        },
        {
            id: 'embedding',
            title: 'Creating embeddings',
            description: 'Each chunk becomes a mathematical representation that captures meaning',
        },
        {
            id: 'indexing',
            title: 'Preparing for search',
            description: 'Your content is indexed for lightning-fast semantic search',
        },
    ]

    const getStageStatus = (stageId: string) => {
        const currentStageIndex = stages.findIndex((s) => s.id === processingStage)
        const stageIndex = stages.findIndex((s) => s.id === stageId)

        if (processingStage === 'complete') return 'complete'
        if (processingStage === 'error') return 'error'
        if (stageIndex < currentStageIndex) return 'complete'
        if (stageIndex === currentStageIndex) return 'active'
        return 'pending'
    }

    return (
        <div className="processing-step">
            <h1>Processing your memo</h1>
            <p className="explanation">
                We're preparing your content to be searchable and ready for questions. Here's what's happening behind
                the scenes:
            </p>

            <div className="processing-visual">
                <div className="pulse-circle" />
            </div>

            <div className="processing-stages">
                {stages.map((stage) => {
                    const status = getStageStatus(stage.id)
                    return (
                        <div key={stage.id} className={`stage-card ${status}`}>
                            <div className="stage-header">
                                <h3 className="stage-title">{stage.title}</h3>
                                {status === 'complete' && <Check className="h-5 w-5 text-green-600" />}
                                {status === 'active' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                            </div>
                            <p className="stage-description">{stage.description}</p>
                        </div>
                    )
                })}
            </div>

            {processingStage === 'error' && (
                <div className="error-container">
                    <p className="error-message">Something went wrong while processing your memo.</p>
                    <div className="button-group">
                        <Button onClick={() => memoUuid && pollMemoProcessing(memoUuid)} variant="outline">
                            Retry
                        </Button>
                        <Button onClick={nextStep}>Skip and Continue</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
