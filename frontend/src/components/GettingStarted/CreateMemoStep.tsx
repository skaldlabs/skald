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

    // Listen for manual copy events (CTRL+C / CMD+C) on desktop
    useEffect(() => {
        if (isMobile) return

        const handleCopy = (e: ClipboardEvent) => {
            console.log('Code copied manually! event:', e)
            // Check if the selection is within our code block
            const selection = window.getSelection()
            if (!selection || !codeBlockRef.current) return

            // Check if the selection intersects with our code block
            if (codeBlockRef.current.contains(selection.anchorNode)) {
                // Manual copy detected, trigger the same behavior as copy button
                handleCodeCopy()
            }
        }

        document.addEventListener('copy', handleCopy)

        return () => {
            document.removeEventListener('copy', handleCopy)
        }
    }, [isMobile, memoCreated])

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
        title: '{title}',
        content: '{content}',
    })

    const isDisabled = !apiKey
    const isComplete = memoCreated

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Create your first memo {isComplete && <Check className="title-check" />}</h2>

                <p className="step-description">
                    Memos are the basic unit of knowledge in Skald. You can store anything as a memo: notes, documents,
                    code snippets, specs, recipes, FAQs, etc.
                </p>

                <p className="step-description">
                    When you add a memo, Skald automatically handles chunking, embeddings, indexing, summarization, and
                    tagging.
                </p>

                <p className="step-description font-bold">
                    Fill in the title and content in the code below, then copy and paste it into your terminal to create
                    your first memo
                </p>

                <div className="code-section" ref={codeBlockRef}>
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <InteractiveCodeBlock
                        code={currentExample.code}
                        language={currentExample.language}
                        onCopy={handleCodeCopy}
                        inputs={[
                            {
                                key: 'title',
                                value: memoTitle,
                                onChange: setMemoTitle,
                                placeholder: 'e.g., JavaScript Async Functions Guide',
                                type: 'input',
                                disabled: isDisabled,
                            },
                            {
                                key: 'content',
                                value: memoContent,
                                onChange: setMemoContent,
                                placeholder: 'e.g., A comprehensive guide about async/await patterns...',
                                type: 'textarea',
                                disabled: isDisabled,
                            },
                        ]}
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
