import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { ChatMessage } from './ChatMessage'

export const ChatMessagesList = () => {
    const messages = useChatStore((state) => state.messages)
    const isStreaming = useChatStore((state) => state.isStreaming)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages.length])

    useEffect(() => {
        if (isStreaming && messagesContainerRef.current && messagesEndRef.current) {
            const container = messagesContainerRef.current
            const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50

            if (isNearBottom) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }, [messages, isStreaming])

    useEffect(() => {
        if (isStreaming && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [isStreaming])

    if (messages.length === 0) {
        return (
            <div className="chat-empty-state">
                <div className="empty-state-content">
                    <h3>Start a conversation</h3>
                    <p>Ask questions about your project data and get intelligent responses</p>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-messages-list" ref={messagesContainerRef}>
            {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}
