import { useRef, useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2, Sparkles } from 'lucide-react'

export const ChatWithSuggestionsStep = () => {
    const chatSuggestions = useOnboardingStore((state) => state.chatSuggestions)
    const isLoadingSuggestions = useOnboardingStore((state) => state.isLoadingSuggestions)
    const chatQuery = useOnboardingStore((state) => state.chatQuery)
    const chatMessages = useOnboardingStore((state) => state.chatMessages)
    const isChatting = useOnboardingStore((state) => state.isChatting)
    const hasChatted = useOnboardingStore((state) => state.hasChatted)
    const setChatQuery = useOnboardingStore((state) => state.setChatQuery)
    const sendChatMessage = useOnboardingStore((state) => state.sendChatMessage)
    const nextStep = useOnboardingStore((state) => state.nextStep)

    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages are added
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
        <div className="chat-suggestions-step">
            <h1>Now, ask questions about your memo!</h1>
            <p className="explanation">
                Your AI agent can now answer questions based on the content you just created. Try one of these suggested
                questions or ask your own.
            </p>

            {chatSuggestions.length > 0 && chatMessages.length === 0 && (
                <div className="suggestions-container">
                    <div className="suggestions-label">
                        <Sparkles className="inline h-4 w-4 mr-1" />
                        Suggested questions:
                    </div>
                    <div className="suggestion-chips">
                        {isLoadingSuggestions ? (
                            <div className="loading-suggestions">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Generating suggestions...</span>
                            </div>
                        ) : (
                            chatSuggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    className="chip"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={isChatting}
                                >
                                    {suggestion}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="chat-interface">
                <div className="chat-messages" ref={messagesContainerRef}>
                    {chatMessages.length === 0 ? (
                        <div className="chat-placeholder">
                            <p>Your conversation will appear here...</p>
                        </div>
                    ) : (
                        chatMessages.map((message) => (
                            <div key={message.id} className={`chat-message ${message.role}`}>
                                <div className="message-content">
                                    {message.content}
                                    {message.role === 'assistant' &&
                                        isChatting &&
                                        message.id === chatMessages[chatMessages.length - 1]?.id && (
                                            <span className="streaming-cursor">|</span>
                                        )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="chat-input-container">
                    <Input
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question..."
                        disabled={isChatting}
                        className="chat-input"
                    />
                    <Button onClick={handleSend} disabled={!chatQuery.trim() || isChatting} size="icon">
                        {isChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="rag-explainer">
                <strong>How it works:</strong> Your question → Find relevant chunks → Generate answer using AI
            </div>

            {hasChatted && (
                <Button onClick={nextStep} size="lg" className="next-button">
                    Continue to API Setup
                </Button>
            )}
        </div>
    )
}
