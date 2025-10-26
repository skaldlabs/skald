import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { CodeLanguageTabs } from '@/components/GettingStarted/CodeLanguageTabs'
import { CodeBlock } from '@/components/GettingStarted/CodeBlock'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { getCreateMemoExample } from '@/components/GettingStarted/createMemoExamples'
import '@/components/GettingStarted/GettingStarted.scss'

export const CreateMemoStep = () => {
    const memoTitle = useOnboardingStore((state) => state.memoTitle)
    const memoContent = useOnboardingStore((state) => state.memoContent)
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const isCreatingMemo = useOnboardingStore((state) => state.isCreatingMemo)
    const memoCreated = useOnboardingStore((state) => state.memoCreated)
    const setMemoTitle = useOnboardingStore((state) => state.setMemoTitle)
    const setMemoContent = useOnboardingStore((state) => state.setMemoContent)
    const createMemo = useOnboardingStore((state) => state.createMemo)
    const [activeTab, setActiveTab] = useState('curl')

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
                <p className="step-description">Implement or run the code below to create your first memo</p>

                <div className="code-section">
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <CodeBlock code={currentExample.code} language={currentExample.language} />
                </div>

                <div className="interactive-section">
                    <div className="form-field">
                        <label>Title</label>
                        <Input
                            value={memoTitle}
                            onChange={(e) => setMemoTitle(e.target.value)}
                            placeholder="Enter memo title"
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="form-field">
                        <label>Content</label>
                        <Textarea
                            value={memoContent}
                            onChange={(e) => setMemoContent(e.target.value)}
                            placeholder="Enter memo content"
                            rows={5}
                            disabled={isDisabled}
                        />
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
            </div>
        </div>
    )
}
