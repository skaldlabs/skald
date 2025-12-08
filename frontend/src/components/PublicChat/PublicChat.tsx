import { useState, useEffect } from 'react'
import { PublicChatMessagesList } from './PublicChatMessagesList'
import { PublicChatInput } from './PublicChatInput'
import { DarkModeToggle } from './DarkModeToggle'
import { usePublicChatStore } from '@/stores/publicChatStore'
import './PublicChat.scss'

interface PublicChatProps {
    slug: string
    logoUrl?: string | null
    title?: string | null
}

export const PublicChat = ({ slug, logoUrl, title }: PublicChatProps) => {
    const messages = usePublicChatStore((state) => state.messages)
    const hasMessages = messages.length > 0
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('public-chat-dark-mode') === 'true'
        }
        return false
    })

    useEffect(() => {
        // Apply dark mode class immediately on mount
        if (isDarkMode) {
            document.documentElement.classList.add('public-chat-dark')
        }
    }, [])

    const handleDarkModeToggle = (isDark: boolean) => {
        setIsDarkMode(isDark)
        if (isDark) {
            document.documentElement.classList.add('public-chat-dark')
        } else {
            document.documentElement.classList.remove('public-chat-dark')
        }
    }

    const showHeader = logoUrl || title

    return (
        <div className={`public-chat-container ${isDarkMode ? 'dark-mode' : ''}`}>
            {showHeader && (
                <div className="public-chat-header">
                    <div className="public-chat-header-left">
                        {logoUrl && (
                            <div className="public-chat-logo">
                                <img src={logoUrl} alt="Logo" />
                            </div>
                        )}
                    </div>
                    <div className="public-chat-header-center">
                        {title && (
                            <div className="public-chat-title">
                                <h1>{title}</h1>
                            </div>
                        )}
                    </div>
                    <div className="public-chat-header-right">
                        <DarkModeToggle onToggle={handleDarkModeToggle} />
                    </div>
                </div>
            )}
            {!showHeader && <DarkModeToggle onToggle={handleDarkModeToggle} />}
            <div className="public-chat-messages-wrapper">
                <PublicChatMessagesList />
            </div>
            <div className={`public-chat-input-wrapper ${hasMessages ? 'has-messages' : ''}`}>
                <PublicChatInput slug={slug} />
            </div>
        </div>
    )
}
