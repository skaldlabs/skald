import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

export const ChatInput = () => {
    const [inputValue, setInputValue] = useState('')
    const { sendMessage, isLoading, isStreaming } = useChatStore()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isLoading && !isStreaming && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isLoading, isStreaming])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading || isStreaming) return

        const message = inputValue.trim()
        setInputValue('')
        await sendMessage(message)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const isDisabled = isLoading || isStreaming || !inputValue.trim()

    return (
        <form onSubmit={handleSubmit} className="chat-input-form">
            <div className="chat-input-container">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your project data..."
                    disabled={isLoading || isStreaming}
                    className="chat-input"
                    autoFocus
                />
                <Button type="submit" disabled={isDisabled} className="chat-send-button" size="sm">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </form>
    )
}
