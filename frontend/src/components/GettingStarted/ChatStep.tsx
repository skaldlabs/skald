import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Send } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { CodeBlock } from './CodeBlock'
import { getChatExample } from '@/components/GettingStarted/chatExamples'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useIsMobile } from '@/hooks/use-mobile'
import '@/components/GettingStarted/GettingStarted.scss'

export const ChatStep = () => {
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const chatQuery = useOnboardingStore((state) => state.chatQuery)
    const chatMessages = useOnboardingStore((state) => state.chatMessages)
    const isChatting = useOnboardingStore((state) => state.isChatting)
    const hasChatted = useOnboardingStore((state) => state.hasChatted)
    const setChatQuery = useOnboardingStore((state) => state.setChatQuery)
    const sendChatMessage = useOnboardingStore((state) => state.sendChatMessage)

    const [activeTab, setActiveTab] = useState('curl')
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const codeBlockRef = useRef<HTMLDivElement | null>(null)
    const isMobile = useIsMobile()

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [chatMessages])

    // Listen for manual copy events (CTRL+C / CMD+C) on desktop
    useEffect(() => {
        if (isMobile) return

        const handleCopy = (e: ClipboardEvent) => {
            console.log('Code copied manually! event:', e)
            // Check if the selection is within our code block
            const selection = window.getSelection()
            if (!selection || !codeBlockRef.current) return

            // Check if the selection intersects with our code block
            if (codeBlockRef.current.contains(selection.anchorNode)) {
                // Manual copy detected - could trigger additional behavior if needed
                console.log('Code copied manually!')
            }
        }

        document.addEventListener('copy', handleCopy)

        return () => {
            document.removeEventListener('copy', handleCopy)
        }
    }, [isMobile, hasChatted])

    const getCodeExample = () => {
        const sampleQuery = chatQuery || ''
        return getChatExample(activeTab, {
            apiKey: apiKey || '',
            query: sampleQuery,
        })
    }

    const isDisabled = !apiKey
    const isComplete = hasChatted

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Chat with your memos {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">
                    Type your question below, then copy and paste the code into your terminal to chat with your memos
                </p>

                <div className="interactive-section">
                    <div className="chat-interface">
                        {isMobile && (
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
                        )}

                        <div className="chat-input-container">
                            <Input
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                placeholder="e.g., What are the benefits of async functions?"
                                disabled={isDisabled || isChatting}
                                onKeyDown={(e) => e.key === 'Enter' && !isChatting && isMobile && sendChatMessage()}
                                className="chat-input"
                            />
                            {isMobile && (
                                <Button
                                    onClick={sendChatMessage}
                                    disabled={isDisabled || isChatting || !chatQuery.trim()}
                                    className="chat-send-button"
                                >
                                    {isChatting ? 'Thinking...' : <Send />}
                                </Button>
                            )}
                        </div>
                        {isMobile && (
                            <div className="mobile-helper-text">
                                On mobile? Test the chat right here. On desktop, we encourage using code!
                            </div>
                        )}
                    </div>
                </div>

                <div className="code-section" ref={codeBlockRef}>
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <CodeBlock code={getCodeExample().code} language={getCodeExample().language} />
                </div>
            </div>
        </div>
    )
}
