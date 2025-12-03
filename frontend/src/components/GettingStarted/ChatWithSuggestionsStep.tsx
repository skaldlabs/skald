import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useChatStore } from '@/stores/chatStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Chat } from '@/components/Playground/Chat'
import { MessageCircle, Search, Brain, Layers, PenLine, PartyPopper, CheckCircle2, ArrowRight } from 'lucide-react'

const ragSteps = [
    {
        icon: PenLine,
        title: 'Query Processing',
        description: 'Your question is optimized for retrieval',
    },
    {
        icon: Search,
        title: 'Vector Search',
        description: 'Find relevant chunks using semantic similarity',
    },
    {
        icon: Layers,
        title: 'Context Assembly',
        description: 'Relevant content is assembled into context',
    },
    {
        icon: Brain,
        title: 'AI Generation',
        description: 'Generate accurate response using context',
    },
]

export const ChatWithSuggestionsStep = () => {
    const navigate = useNavigate()
    const reset = useOnboardingStore((state) => state.reset)
    const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding)

    const messages = useChatStore((state) => state.messages)
    const clearMessages = useChatStore((state) => state.clearMessages)

    // Show completion panel after receiving first AI response (at least 2 messages)
    const hasReceivedResponse = messages.length >= 2

    const handleGoToDashboard = async () => {
        await completeOnboarding()
        reset()
        clearMessages()
        navigate('/')
    }

    return (
        <div className={`chat-step-wrapper ${hasReceivedResponse ? 'has-chatted' : ''}`}>
            <div className="chat-step-container">
                <Card className="info-panel">
                    <CardContent className="info-panel-content">
                        <Badge variant="secondary" className="info-badge">
                            <MessageCircle className="h-3.5 w-3.5" />
                            Try it out
                        </Badge>

                        <h2>Ask questions about your memo</h2>

                        <p className="info-description">
                            Your content is now indexed. Ask any question and watch the AI retrieve relevant information
                            to generate accurate answers.
                        </p>

                        <div className="rag-pipeline">
                            <span className="pipeline-label">How it works</span>
                            {ragSteps.map((step, index) => (
                                <div key={step.title} className="rag-step">
                                    <div className="step-number">{index + 1}</div>
                                    <div className="step-icon">
                                        <step.icon className="h-4 w-4" />
                                    </div>
                                    <div className="step-content">
                                        <span className="step-title">{step.title}</span>
                                        <span className="step-description">{step.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="chat-panel">
                    <CardContent className="chat-panel-content">
                        <Chat />
                    </CardContent>
                </Card>

                {hasReceivedResponse && (
                    <Card className="completion-panel">
                        <CardContent className="completion-panel-content">
                            <div className="completion-icon">
                                <PartyPopper className="h-8 w-8" />
                            </div>

                            <Badge variant="secondary" className="completion-badge">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
                            </Badge>

                            <h3>You're all set!</h3>

                            <p className="completion-description">
                                You've successfully created your first memo and experienced RAG in action.
                            </p>

                            <div className="completion-checklist">
                                <div className="checklist-item">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Content indexed</span>
                                </div>
                                <div className="checklist-item">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Embeddings generated</span>
                                </div>
                                <div className="checklist-item">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>AI chat working</span>
                                </div>
                            </div>

                            <Button onClick={handleGoToDashboard} size="lg" className="dashboard-button">
                                Go to Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
