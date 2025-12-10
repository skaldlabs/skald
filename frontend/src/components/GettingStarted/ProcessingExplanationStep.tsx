import { useEffect, useRef } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Check, Loader2, MessageCircle, ArrowRight, CheckCircle2, AlertCircle, Circle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const ProcessingExplanationStep = () => {
    const processingStage = useOnboardingStore((state) => state.processingStage)
    const memoUuid = useOnboardingStore((state) => state.memoUuid)
    const pollMemoProcessing = useOnboardingStore((state) => state.pollMemoProcessing)
    const stopPolling = useOnboardingStore((state) => state.stopPolling)
    const nextStep = useOnboardingStore((state) => state.nextStep)
    const selectedFile = useOnboardingStore((state) => state.selectedFile)

    // Track if polling has been started to prevent duplicate calls
    const pollingStartedRef = useRef(false)

    // Start polling when component mounts - only once
    useEffect(() => {
        if (memoUuid && !pollingStartedRef.current) {
            pollingStartedRef.current = true
            pollMemoProcessing(memoUuid)
        }

        return () => {
            stopPolling()
            pollingStartedRef.current = false
        }
    }, [memoUuid, pollMemoProcessing, stopPolling])

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

    // Success state - show completion message
    if (processingStage === 'complete') {
        return (
            <div className="processing-step success-state">
                <Card className="success-card">
                    <CardContent className="success-card-content">
                        <div className="success-badge-container">
                            <Badge variant="secondary" className="success-badge">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Processing complete
                            </Badge>
                        </div>

                        <h1>Your memo is ready</h1>

                        <p className="success-description">
                            We've indexed your content and it's now searchable. Try asking a question to see how the AI
                            uses your memo to generate accurate responses.
                        </p>

                        <div className="success-features">
                            <div className="feature">
                                <Check className="h-4 w-4" />
                                <span>Content chunked & indexed</span>
                            </div>
                            <div className="feature">
                                <Check className="h-4 w-4" />
                                <span>Embeddings generated</span>
                            </div>
                            <div className="feature">
                                <Check className="h-4 w-4" />
                                <span>Ready for semantic search</span>
                            </div>
                        </div>

                        <Button onClick={nextStep} size="lg" className="success-cta">
                            <MessageCircle className="h-4 w-4" />
                            Start chatting
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error state
    if (processingStage === 'error') {
        return (
            <div className="processing-step error-state">
                <Card className="processing-card">
                    <CardContent className="processing-card-content">
                        <div className="processing-badge-container">
                            <Badge variant="destructive" className="error-badge">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Processing failed
                            </Badge>
                        </div>

                        <h1>Something went wrong</h1>

                        <p className="processing-description">
                            We encountered an error while processing your memo. You can try again or skip this step and
                            continue with the setup.
                        </p>

                        <div className="error-actions">
                            <Button
                                onClick={() => memoUuid && pollMemoProcessing(memoUuid)}
                                variant="outline"
                                className="retry-button"
                            >
                                Try again
                            </Button>
                            <Button onClick={nextStep} className="skip-button">
                                Skip and continue
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Processing state
    return (
        <div className="processing-step processing-state">
            <Card className="processing-card">
                <CardContent className="processing-card-content">
                    <div className="processing-badge-container">
                        <Badge variant="secondary" className="processing-badge">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Processing
                        </Badge>
                    </div>

                    <h1>Processing your memo</h1>

                    <p className="processing-description">
                        We're preparing your content to be searchable. This usually takes just a few{' '}
                        {selectedFile ? 'minutes' : 'seconds'}.
                    </p>

                    {selectedFile && (
                        <Alert className="file-processing-warning mb-4 bg-amber-500/10 border-amber-500/20">
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                                Document processing can take several minutes depending on file size and complexity.
                                Please keep this page open until processing completes.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="stages-list">
                        {stages.map((stage) => {
                            const status = getStageStatus(stage.id)
                            return (
                                <div key={stage.id} className={`stage-item ${status}`}>
                                    <div className="stage-icon">
                                        {status === 'complete' && <Check className="h-4 w-4" />}
                                        {status === 'active' && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {status === 'pending' && <Circle className="h-4 w-4" />}
                                    </div>
                                    <div className="stage-content">
                                        <span className="stage-title">{stage.title}</span>
                                        <span className="stage-description">{stage.description}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
