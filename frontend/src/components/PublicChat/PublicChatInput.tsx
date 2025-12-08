import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { usePublicChatStore } from '@/stores/publicChatStore'

interface PublicChatInputProps {
    slug: string
}

export const PublicChatInput = ({ slug }: PublicChatInputProps) => {
    const [inputValue, setInputValue] = useState('')
    const { sendMessage, isLoading, isStreaming } = usePublicChatStore()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!isLoading && !isStreaming && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [isLoading, isStreaming])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [inputValue])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading || isStreaming) return

        const message = inputValue.trim()
        setInputValue('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
        await sendMessage(message, slug)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const isDisabled = isLoading || isStreaming || !inputValue.trim()

    return (
        <form onSubmit={handleSubmit} className="public-chat-input-container">
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                disabled={isLoading || isStreaming}
                className="public-chat-input"
                rows={1}
                autoFocus
            />
            <button type="submit" disabled={isDisabled} className="public-chat-send-button" aria-label="Send message">
                <Send size={20} />
            </button>
        </form>
    )
}
