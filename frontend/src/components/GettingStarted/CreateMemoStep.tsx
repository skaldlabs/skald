import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Check, Loader2 } from 'lucide-react'
import { CodeLanguageTabs } from '@/components/GettingStarted/CodeLanguageTabs'
import { CodeBlock } from '@/components/GettingStarted/CodeBlock'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { getCreateMemoExample } from '@/components/GettingStarted/createMemoExamples'
import { useIsMobile } from '@/hooks/use-mobile'
import { useProjectStore } from '@/stores/projectStore'
import { api } from '@/lib/api'
import '@/components/GettingStarted/GettingStarted.scss'

interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export const CreateMemoStep = () => {
    const memoTitle = useOnboardingStore((state) => state.memoTitle)
    const memoContent = useOnboardingStore((state) => state.memoContent)
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const isCreatingMemo = useOnboardingStore((state) => state.isCreatingMemo)
    const memoCreated = useOnboardingStore((state) => state.memoCreated)
    const setMemoTitle = useOnboardingStore((state) => state.setMemoTitle)
    const setMemoContent = useOnboardingStore((state) => state.setMemoContent)
    const createMemo = useOnboardingStore((state) => state.createMemo)
    const currentProject = useProjectStore((state) => state.currentProject)
    const [activeTab, setActiveTab] = useState('curl')
    const [isWaitingForMemo, setIsWaitingForMemo] = useState(false)
    const isMobile = useIsMobile()

    const initialMemoCountRef = useRef<number | null>(null)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isPollingRef = useRef(false)

    // Get initial memo count when component mounts or API key is generated
    useEffect(() => {
        const fetchInitialMemoCount = async () => {
            if (!currentProject || !apiKey || memoCreated) return

            try {
                const response = await api.get<PaginatedResponse<unknown>>(
                    `/v1/memo/?page=1&page_size=1&project_id=${currentProject.uuid}`
                )
                if (response.data) {
                    initialMemoCountRef.current = response.data.count
                }
            } catch (error) {
                console.error('Failed to fetch initial memo count:', error)
            }
        }

        fetchInitialMemoCount()
    }, [currentProject, apiKey, memoCreated])

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }
        }
    }, [])

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
        isPollingRef.current = false
        setIsWaitingForMemo(false)
    }

    const checkForNewMemo = async () => {
        if (!currentProject || initialMemoCountRef.current === null) return

        try {
            const response = await api.get<PaginatedResponse<unknown>>(
                `/v1/memo/?page=1&page_size=1&project_id=${currentProject.uuid}`
            )

            if (response.data && response.data.count > initialMemoCountRef.current) {
                // New memo detected!
                useOnboardingStore.setState({ memoCreated: true })
                stopPolling()
            }
        } catch (error) {
            console.error('Error polling for new memo:', error)
        }
    }

    const startPolling = () => {
        // Don't start polling if already polling, on mobile, or if step is already complete
        if (isPollingRef.current || isMobile || memoCreated || !currentProject) return

        isPollingRef.current = true
        setIsWaitingForMemo(true)

        // Check immediately
        checkForNewMemo()

        // Then check every 2 seconds
        pollingIntervalRef.current = setInterval(checkForNewMemo, 2000)
    }

    const handleCodeCopy = () => {
        // Only start polling on desktop when code is copied
        if (!isMobile) {
            startPolling()
        }
    }

    const currentExample = getCreateMemoExample(activeTab, {
        apiKey: apiKey || '',
        title: memoTitle || '',
        content: memoContent || '',
    })

    const isDisabled = !apiKey
    const isComplete = memoCreated

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Create your first memo {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">
                    Fill in the title and content below, then copy and paste the code into your terminal to create your
                    first memo
                </p>

                <div className="interactive-section">
                    <div className="form-field">
                        <label>Title</label>
                        <Input
                            value={memoTitle}
                            onChange={(e) => setMemoTitle(e.target.value)}
                            placeholder="e.g., JavaScript Async Functions Guide"
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="form-field">
                        <label>Content</label>
                        <Textarea
                            value={memoContent}
                            onChange={(e) => setMemoContent(e.target.value)}
                            placeholder="e.g., A comprehensive guide about async/await patterns in JavaScript..."
                            rows={5}
                            disabled={isDisabled}
                        />
                    </div>
                    {isMobile && (
                        <div className="mobile-helper-text">
                            On mobile? Use the button below. On desktop, we encourage using code!
                        </div>
                    )}
                    {isMobile && (
                        <div className="button-group">
                            <Button
                                onClick={createMemo}
                                disabled={isDisabled || isCreatingMemo || !memoTitle.trim() || !memoContent.trim()}
                            >
                                {isCreatingMemo ? 'Creating...' : 'Create memo'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="code-section">
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <CodeBlock code={currentExample.code} language={currentExample.language} onCopy={handleCodeCopy} />
                </div>

                {isWaitingForMemo && !isMobile && (
                    <div className="waiting-indicator">
                        <Loader2 className="spinner" size={20} />
                        <span>Waiting for memo to be created...</span>
                    </div>
                )}
            </div>
        </div>
    )
}
