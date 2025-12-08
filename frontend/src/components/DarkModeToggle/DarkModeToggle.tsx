import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'

export const DarkModeToggle = () => {
    const { theme, toggleTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="absolute top-4 right-4"
            aria-label="Toggle dark mode"
        >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
    )
}
