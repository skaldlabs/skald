import { ChatMessage as ChatMessageType } from '@/stores/chatStore'
import { User, Bot } from 'lucide-react'

interface ChatMessageProps {
    message: ChatMessageType
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'
    const isSystem = message.role === 'system'

    return (
        <div className={`chat-message ${message.role}`}>
            <div className="message-avatar">
                {isUser && <User size={16} />}
                {isAssistant && <Bot size={16} />}
                {isSystem && <div className="system-icon">!</div>}
            </div>
            <div className="message-content">
                <div className="message-text">
                    {message.content}
                    {message.isStreaming && <span className="streaming-cursor"></span>}
                </div>
                <div className="message-timestamp">{message.timestamp.toLocaleTimeString()}</div>
            </div>
        </div>
    )
}
