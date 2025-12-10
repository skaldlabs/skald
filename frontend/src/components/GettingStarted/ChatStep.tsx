import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Send } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { InteractiveCodeBlock } from './InteractiveCodeBlock'
import { getChatExample } from '@/components/GettingStarted/chatExamples'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useIsMobile } from '@/hooks/use-mobile'
import '@/components/GettingStarted/GettingStarted.scss'
import { useAuthStore } from '@/stores/authStore'

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
    const user = useAuthStore((state) => state.user)

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [chatMessages])

    const getCodeExample = () => {
        return getChatExample(activeTab, {
            apiKey: apiKey || '',
            query: `What does ${user?.organization_name} do?`,
        })
    }

    const isDisabled = !apiKey
    const isComplete = hasChatted

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Chat with your agent {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">
                    ⚡ Ask a question and get really fast responses from your agent based on the context you added.
                </p>

                <div className="code-section" ref={codeBlockRef}>
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <InteractiveCodeBlock
                        code={getCodeExample().code}
                        language={getCodeExample().language}
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
            </div>
        </div>
    )
}
