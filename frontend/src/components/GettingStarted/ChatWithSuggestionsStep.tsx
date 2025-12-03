import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useChatStore } from '@/stores/chatStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Chat } from '@/components/Playground/Chat'
import {
    Loader2,
    Sparkles,
    MessageCircle,
    Search,
    Brain,
    Layers,
    Lightbulb,
    PenLine,
    LayoutDashboard,
} from 'lucide-react'

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
    const chatSuggestions = useOnboardingStore((state) => state.chatSuggestions)
    const isLoadingSuggestions = useOnboardingStore((state) => state.isLoadingSuggestions)
    const reset = useOnboardingStore((state) => state.reset)

    const messages = useChatStore((state) => state.messages)
    const isStreaming = useChatStore((state) => state.isStreaming)
    const sendMessage = useChatStore((state) => state.sendMessage)
    const clearMessages = useChatStore((state) => state.clearMessages)

    const hasChatted = messages.length > 0

    const handleGoToDashboard = () => {
        reset()
        clearMessages()
        navigate('/')
    }

    const handleSuggestionClick = (suggestion: string) => {
        if (!isStreaming) {
            sendMessage(suggestion)
        }
    }

    return (
        <div className={`chat-step-wrapper ${hasChatted ? 'has-chatted' : ''}`}>
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

                <Card className="suggestions-panel">
                    <CardContent className="suggestions-panel-content">
                        <Badge variant="secondary" className="suggestions-badge">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Ideas
                        </Badge>

                        <h3>Need inspiration?</h3>

                        {isLoadingSuggestions ? (
                            <div className="suggestions-loading">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <p>Generating example questions based on your memo...</p>
                            </div>
                        ) : chatSuggestions.length > 0 ? (
                            <div className="suggestions-list">
                                {chatSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        disabled={isStreaming}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        <span>{suggestion}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="suggestions-empty">
                                <p>No suggestions available. Try asking your own question!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {hasChatted && (
                <div className="continue-section">
                    <Button
                        onClick={handleGoToDashboard}
                        size="lg"
                        variant="outline"
                        className="continue-button secondary"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Go to Dashboard
                    </Button>
                </div>
            )}
        </div>
    )
}
