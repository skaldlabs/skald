import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { CodeBlock } from './CodeBlock'
import { domain } from '@/lib/api'
import { useOnboardingStore } from '@/stores/onboardingStore'
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

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [chatMessages])

    const getCurlCommand = () => {
        const sampleQuery = chatQuery || 'What are the benefits of async functions?'
        setChatQuery(sampleQuery)

        return `curl -X POST '${domain}/api/v1/chat/' \\
  -H 'Authorization: Bearer ${apiKey || 'your_api_key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "query": "${sampleQuery}",
  "stream": true
}'`
    }

    const isDisabled = !apiKey
    const isComplete = hasChatted

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Chat with your memos {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">Ask questions about your memos and get intelligent responses</p>

                <div className="code-section">
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <CodeBlock code={getCurlCommand()} language="bash" />
                </div>

                <div className="interactive-section">
                    <div className="chat-interface">
                        <div className="chat-messages" ref={messagesContainerRef}>
                            {chatMessages.length === 0 ? (
                                <div className="chat-placeholder">
                                    <p>Start a conversation by asking a question about your memos...</p>
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
                                placeholder="Ask a question about your memos..."
                                disabled={isDisabled || isChatting}
                                onKeyDown={(e) => e.key === 'Enter' && !isChatting && sendChatMessage()}
                                className="chat-input"
                            />
                            <Button
                                onClick={sendChatMessage}
                                disabled={isDisabled || isChatting || !chatQuery.trim()}
                                className="chat-send-button"
                            >
                                {isChatting ? 'Thinking...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
