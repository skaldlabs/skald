import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

interface DarkModeToggleProps {
    onToggle: (isDark: boolean) => void
}

export const DarkModeToggle = ({ onToggle }: DarkModeToggleProps) => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('public-chat-dark-mode') === 'true'
        }
        return false
    })

    useEffect(() => {
        // Notify parent of initial state
        onToggle(isDark)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleToggle = () => {
        const newValue = !isDark
        setIsDark(newValue)
        localStorage.setItem('public-chat-dark-mode', String(newValue))
        onToggle(newValue)
    }

    return (
        <button
            onClick={handleToggle}
            className="dark-mode-toggle"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    )
}
