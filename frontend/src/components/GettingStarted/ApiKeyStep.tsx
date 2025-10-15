import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useProjectStore } from '@/stores/projectStore'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import '@/components/GettingStarted/GettingStarted.scss'

export const ApiKeyStep = () => {
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const setApiKey = useOnboardingStore((state) => state.setApiKey)
    const isGeneratingApiKey = useOnboardingStore((state) => state.isGeneratingApiKey)
    const generateApiKey = useOnboardingStore((state) => state.generateApiKey)
    const currentProject = useProjectStore((state) => state.currentProject)

    const [isVisible, setIsVisible] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)

    const hasExistingApiKey = currentProject?.has_api_key && !apiKey
    const existingApiKeyPrefix = currentProject?.api_key_first_12_digits || ''

    useEffect(() => {
        if (hasExistingApiKey && existingApiKeyPrefix) {
            setApiKey(existingApiKeyPrefix + '•'.repeat(20))
        }
    }, [hasExistingApiKey, existingApiKeyPrefix, setApiKey])

    const handleGenerateApiKey = async () => {
        await generateApiKey()
        setIsVisible(true)
        setShowRegenerateDialog(false)
    }

    const handleRegenerateClick = () => {
        setShowRegenerateDialog(true)
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
        <>
            <div className={`getting-started-step ${isComplete ? 'complete' : ''}`}>
                <div className="step-content">
                    <h2 className="step-title">
                        Add an API Key to your project {isComplete && <Check className="title-check" />}
                    </h2>
                    <p className="step-description">
                        {apiKey && apiKey.includes('•')
                            ? 'Your project already has an API key. You can regenerate it if needed.'
                            : apiKey
                              ? 'Use the following generated key to authenticate requests'
                              : 'Generate an API key for your project to get started'}
                    </p>

                    {apiKey && apiKey.includes('•') ? (
                        <div className="api-key-display">
                            <Input type="text" value={apiKey} readOnly className="api-key-input" />
                            <Button
                                variant="outline"
                                onClick={handleRegenerateClick}
                                disabled={isGeneratingApiKey}
                                style={{ marginLeft: '8px' }}
                            >
                                Regenerate
                            </Button>
                        </div>
                    ) : apiKey ? (
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

            <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Regenerate API Key?
                        </DialogTitle>
                        <DialogDescription>
                            This will generate a new API key and invalidate your existing key. Any applications using
                            the old key will stop working immediately.
                            <br />
                            <br />
                            Are you sure you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleGenerateApiKey} disabled={isGeneratingApiKey}>
                            {isGeneratingApiKey ? 'Generating...' : 'Yes, Regenerate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
