import { useEffect, useRef } from 'react'
import { usePublicChatStore } from '@/stores/publicChatStore'
import { PublicChatMessage } from './PublicChatMessage'

export const PublicChatMessagesList = () => {
    const messages = usePublicChatStore((state) => state.messages)
    const isStreaming = usePublicChatStore((state) => state.isStreaming)

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
            <div className="public-chat-empty-state">
                <div className="public-empty-state-content">
                    <h3>How can I help you?</h3>
                </div>
            </div>
        )
    }

    return (
        <div className="public-chat-messages-list" ref={messagesContainerRef}>
            {messages.map((message) => (
                <PublicChatMessage key={message.id} message={message} referencesEnabled={true} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}
