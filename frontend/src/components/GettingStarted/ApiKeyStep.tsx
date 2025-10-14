import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import './GettingStarted.scss'

interface ApiKeyStepProps {
    onApiKeyGenerated?: (apiKey: string) => void
}

export const ApiKeyStep = ({ onApiKeyGenerated }: ApiKeyStepProps) => {
    const { currentProject, generateApiKey } = useProjectStore()
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerateApiKey = async () => {
        if (!currentProject) return

        setIsGenerating(true)
        const key = await generateApiKey(currentProject.uuid)
        if (key) {
            setApiKey(key)
            setIsVisible(true)
            onApiKeyGenerated?.(key)
        }
        setIsGenerating(false)
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
                    <Button onClick={handleGenerateApiKey} disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : 'Generate API Key'}
                    </Button>
                )}
            </div>
        </div>
    )
}
