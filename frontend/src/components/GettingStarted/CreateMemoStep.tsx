import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { CodeLanguageTabs } from '@/components/GettingStarted/CodeLanguageTabs'
import { InteractiveCodeBlock } from '@/components/GettingStarted/InteractiveCodeBlock'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { getCreateMemoExample } from '@/components/GettingStarted/createMemoExamples'
import { useIsMobile } from '@/hooks/use-mobile'
import { useProjectStore } from '@/stores/projectStore'
import { api } from '@/lib/api'
import '@/components/GettingStarted/GettingStarted.scss'
import { useAuthStore } from '@/stores/authStore'

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
    const createMemo = useOnboardingStore((state) => state.createMemo)
    const currentProject = useProjectStore((state) => state.currentProject)
    const [activeTab, setActiveTab] = useState('curl')
    const [isWaitingForMemo, setIsWaitingForMemo] = useState(false)
    const isMobile = useIsMobile()

    const user = useAuthStore((state) => state.user)

    const initialMemoCountRef = useRef<number | null>(null)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isPollingRef = useRef(false)
    const codeBlockRef = useRef<HTMLDivElement | null>(null)

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
        title: `Introduction to ${user?.organization_name}`,
        content: `${user?.organization_name} is a really cool company that makes a really cool product.`,
    })

    const isDisabled = !apiKey
    const isComplete = memoCreated

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">
                    Add context to your agent {isComplete && <Check className="title-check" />}
                </h2>

                <p className="step-description">
                    Memos are the basic unit of knowledge in Skald. They can be anything: a document, a note, or some
                    code.
                </p>

                <p className="step-description">
                    After a memo is processed, it's automatically available as context for chat and search.
                </p>

                <p className="step-description font-bold">
                    ➡️ Create your first memo now using one of the code examples below:
                </p>

                <div className="code-section" ref={codeBlockRef}>
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <InteractiveCodeBlock
                        code={currentExample.code}
                        language={currentExample.language}
                        onCopy={handleCodeCopy}
                        inputs={[]}
                    />
                </div>

                {isMobile && (
                    <div className="interactive-section">
                        <div className="mobile-helper-text">
                            On mobile? Use the button below. On desktop, we encourage using code!
                        </div>
                        <div className="button-group">
                            <Button
                                onClick={createMemo}
                                disabled={isDisabled || isCreatingMemo || !memoTitle.trim() || !memoContent.trim()}
                            >
                                {isCreatingMemo ? 'Creating...' : 'Create memo'}
                            </Button>
                        </div>
                    </div>
                )}

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
