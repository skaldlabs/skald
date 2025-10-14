import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import '@/components/GettingStarted/GettingStarted.scss'

export const ApiKeyStep = () => {
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const isGeneratingApiKey = useOnboardingStore((state) => state.isGeneratingApiKey)
    const generateApiKey = useOnboardingStore((state) => state.generateApiKey)

    const [isVisible, setIsVisible] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const handleGenerateApiKey = async () => {
        await generateApiKey()
        if (apiKey) {
            setIsVisible(true)
        }
    }

    const handleCopy = async () => {
        if (!apiKey) return
        await navigator.clipboard.writeText(apiKey)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    const displayValue = apiKey ? (isVisible ? apiKey : '•'.repeat(apiKey.length)) : ''

    const isComplete = !!apiKey

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">
                    Add an API Key to your project {isComplete && <Check className="title-check" />}
                </h2>
                <p className="step-description">
                    {apiKey
                        ? 'Use the following generated key to authenticate requests'
                        : 'Generate an API key for your project to get started'}
                </p>

                {apiKey ? (
                    <div className="api-key-display">
                        <Input type="text" value={displayValue} readOnly className="api-key-input" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsVisible(!isVisible)}
                            className="icon-button"
                        >
                            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCopy} className="icon-button">
                            {isCopied ? <Check size={18} /> : <Copy size={18} />}
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleGenerateApiKey} disabled={isGeneratingApiKey}>
                        {isGeneratingApiKey ? 'Generating...' : 'Generate API Key'}
                    </Button>
                )}
            </div>
        </div>
    )
}
