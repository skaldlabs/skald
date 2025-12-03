import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Send,
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
    const chatQuery = useOnboardingStore((state) => state.chatQuery)
    const chatMessages = useOnboardingStore((state) => state.chatMessages)
    const isChatting = useOnboardingStore((state) => state.isChatting)
    const hasChatted = useOnboardingStore((state) => state.hasChatted)
    const setChatQuery = useOnboardingStore((state) => state.setChatQuery)
    const sendChatMessage = useOnboardingStore((state) => state.sendChatMessage)
    const reset = useOnboardingStore((state) => state.reset)

    const messagesContainerRef = useRef<HTMLDivElement>(null)

    const handleGoToDashboard = () => {
        reset()
        navigate('/')
    }

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [chatMessages])

    const handleSuggestionClick = (suggestion: string) => {
        setChatQuery(suggestion)
        setTimeout(() => {
            sendChatMessage()
        }, 100)
    }

    const handleSend = () => {
        if (chatQuery.trim() && !isChatting) {
            sendChatMessage()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isChatting) {
            handleSend()
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
                        <div className="chat-messages" ref={messagesContainerRef}>
                            {chatMessages.length === 0 ? (
                                <div className="chat-empty">
                                    <MessageCircle className="h-10 w-10" />
                                    <span>Start a conversation</span>
                                    <p>Ask a question about your memo to see AI-powered retrieval in action</p>
                                </div>
                            ) : (
                                chatMessages.map((message) => (
                                    <div key={message.id} className={`chat-message ${message.role}`}>
                                        <div className="message-bubble">
                                            {message.content}
                                            {message.role === 'assistant' &&
                                                isChatting &&
                                                message.id === chatMessages[chatMessages.length - 1]?.id && (
                                                    <span className="cursor">|</span>
                                                )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="chat-input-area">
                            <Input
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a question about your memo..."
                                disabled={isChatting}
                            />
                            <Button onClick={handleSend} disabled={!chatQuery.trim() || isChatting} size="icon">
                                {isChatting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
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
                                        disabled={isChatting}
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
