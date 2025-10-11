import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeContextType = {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('light')

    useEffect(() => {
        // On mount, check localStorage or system preference
        const stored = localStorage.getItem('theme')
        if (stored === 'dark' || stored === 'light') {
            setThemeState(stored)
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setThemeState('dark')
        }
    }, [])

    useEffect(() => {
        // Toggle the `dark` class on <html>
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const setTheme = (t: Theme) => setThemeState(t)
    const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

    return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
    return ctx
}
