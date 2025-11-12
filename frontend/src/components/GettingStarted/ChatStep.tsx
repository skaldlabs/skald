import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Send, Loader2 } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { InteractiveCodeBlock } from './InteractiveCodeBlock'
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
    const [isWaitingForChat, setIsWaitingForChat] = useState(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const codeBlockRef = useRef<HTMLDivElement | null>(null)
    const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isMobile = useIsMobile()

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [chatMessages])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (waitingTimeoutRef.current) {
                clearTimeout(waitingTimeoutRef.current)
            }
        }
    }, [])

    // Watch for hasChatted to become true and stop waiting
    useEffect(() => {
        if (hasChatted && isWaitingForChat) {
            stopWaiting()
        }
    }, [hasChatted, isWaitingForChat])

    const stopWaiting = () => {
        if (waitingTimeoutRef.current) {
            clearTimeout(waitingTimeoutRef.current)
            waitingTimeoutRef.current = null
        }
        setIsWaitingForChat(false)
    }

    const startWaiting = () => {
        // Don't start waiting if already waiting, on mobile, or if step is already complete
        if (isWaitingForChat || isMobile || hasChatted) return

        setIsWaitingForChat(true)

        // Auto-complete after 30 seconds (giving user time to run the code)
        waitingTimeoutRef.current = setTimeout(() => {
            useOnboardingStore.setState({ hasChatted: true })
            setIsWaitingForChat(false)
        }, 30000)
    }

    const handleCodeCopy = () => {
        // Only start waiting on desktop when code is copied
        if (!isMobile) {
            startWaiting()
        }
    }

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
                // Manual copy detected, trigger the same behavior as copy button
                handleCodeCopy()
            }
        }

        document.addEventListener('copy', handleCopy)

        return () => {
            document.removeEventListener('copy', handleCopy)
        }
    }, [isMobile, hasChatted, isWaitingForChat])

    const getCodeExample = () => {
        return getChatExample(activeTab, {
            apiKey: apiKey || '',
            query: '<placeholder>',
        })
    }

    const isDisabled = !apiKey
    const isComplete = hasChatted

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Chat with your memos {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">
                    Type your question in the code below, then copy and paste it into your terminal to chat with your
                    memos
                </p>

                <div className="code-section" ref={codeBlockRef}>
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <InteractiveCodeBlock
                        code={getCodeExample().code}
                        language={getCodeExample().language}
                        onCopy={handleCodeCopy}
                        inputs={[]}
                    />
                </div>

                {isMobile && (
                    <div className="interactive-section">
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
                                    placeholder="Your question here..."
                                    disabled={isDisabled || isChatting}
                                    onKeyDown={(e) => e.key === 'Enter' && !isChatting && sendChatMessage()}
                                    className="chat-input"
                                />
                                <Button
                                    onClick={sendChatMessage}
                                    disabled={isDisabled || isChatting || !chatQuery.trim()}
                                    className="chat-send-button"
                                >
                                    {isChatting ? 'Thinking...' : <Send />}
                                </Button>
                            </div>

                            <div className="mobile-helper-text">
                                On mobile? Test the chat right here. On desktop, we encourage using code!
                            </div>
                        </div>
                    </div>
                )}

                {isWaitingForChat && !isMobile && (
                    <div className="waiting-indicator">
                        <Loader2 className="spinner" size={20} />
                        <span>Waiting for chat to be sent...</span>
                    </div>
                )}
            </div>
        </div>
    )
}
