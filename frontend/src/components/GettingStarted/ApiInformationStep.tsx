import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Copy, Check, AlertTriangle, ExternalLink, PartyPopper } from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useProjectStore } from '@/stores/projectStore'
import { CodeLanguageTabs } from '@/components/GettingStarted/CodeLanguageTabs'
import { InteractiveCodeBlock } from '@/components/GettingStarted/InteractiveCodeBlock'
import { getCreateMemoExample } from '@/components/GettingStarted/createMemoExamples'
import { getChatExample } from '@/components/GettingStarted/chatExamples'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export const ApiInformationStep = () => {
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const setApiKey = useOnboardingStore((state) => state.setApiKey)
    const isGeneratingApiKey = useOnboardingStore((state) => state.isGeneratingApiKey)
    const generateApiKey = useOnboardingStore((state) => state.generateApiKey)
    const currentProject = useProjectStore((state) => state.currentProject)
    const user = useAuthStore((state) => state.user)
    const navigate = useNavigate()

    const [isVisible, setIsVisible] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
    const [activeTab, setActiveTab] = useState('curl')

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

    const memoExample = getCreateMemoExample(activeTab, {
        apiKey: apiKey || 'your-api-key',
        title: `Introduction to ${user?.organization_name}`,
        content: `${user?.organization_name} is a really cool company.`,
    })

    const chatExample = getChatExample(activeTab, {
        apiKey: apiKey || 'your-api-key',
        query: `What does ${user?.organization_name} do?`,
    })

    const goToDashboard = () => {
        if (currentProject) {
            navigate(`/projects/${currentProject.uuid}/memos`)
        }
    }

    return (
        <>
            <div className="api-information-step">
                <div className="celebration-header">
                    <PartyPopper className="h-12 w-12 text-primary mb-4" />
                    <h1>You're all set!</h1>
                    <p className="explanation">
                        You've just experienced the core of Skald. Now let's show you how to integrate it into your
                        applications via API.
                    </p>
                </div>

                <div className="api-key-section">
                    <h2>Your API Key</h2>
                    <p className="section-description">
                        {apiKey && apiKey.includes('•')
                            ? 'Your project already has an API key. You can regenerate it if needed.'
                            : apiKey
                              ? 'Use this key to authenticate your API requests'
                              : 'Generate an API key to start using Skald programmatically'}
                    </p>

                    {apiKey && apiKey.includes('•') ? (
                        <div className="api-key-display">
                            <Input type="text" value={apiKey} readOnly className="api-key-input" />
                            <Button variant="outline" onClick={handleRegenerateClick} disabled={isGeneratingApiKey}>
                                Regenerate
                            </Button>
                        </div>
                    ) : apiKey ? (
                        <div className="api-key-display">
                            <Input type="text" value={displayValue} readOnly className="api-key-input" />
                            <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)}>
                                {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCopy}>
                                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={handleGenerateApiKey} disabled={isGeneratingApiKey} size="lg">
                            {isGeneratingApiKey ? 'Generating...' : 'Generate API Key'}
                        </Button>
                    )}
                </div>

                {apiKey && (
                    <>
                        <div className="code-examples-section">
                            <h2>Code Examples</h2>
                            <p className="section-description">Everything you just did can be done via API</p>

                            <div className="example-group">
                                <h3>Create a Memo</h3>
                                <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                                <InteractiveCodeBlock
                                    code={memoExample.code}
                                    language={memoExample.language}
                                    onCopy={() => {}}
                                    inputs={[]}
                                />
                            </div>

                            <div className="example-group">
                                <h3>Chat with Your Agent</h3>
                                <InteractiveCodeBlock
                                    code={chatExample.code}
                                    language={chatExample.language}
                                    onCopy={() => {}}
                                    inputs={[]}
                                />
                            </div>
                        </div>

                        <div className="docs-link-section">
                            <h3>Want to learn more?</h3>
                            <p>Check out our full documentation for advanced features and detailed guides.</p>
                            <a
                                href="https://docs.useskald.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="docs-link"
                            >
                                View Documentation
                                <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                        </div>

                        <Button onClick={goToDashboard} size="lg" className="dashboard-button">
                            Go to Dashboard
                        </Button>
                    </>
                )}
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
