import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { CodeBlock } from './CodeBlock'
import { domain } from '@/lib/api'
import { useOnboardingStore } from '@/stores/onboardingStore'
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

    const getCurlCommand = () => {
        const sampleTitle = memoTitle || 'Using Async Functions in JavaScript'
        const sampleContent =
            memoContent ||
            'async functions simplify working with promises in JavaScript. They allow you to write asynchronous code that looks synchronous, using the await keyword. For example, const data = await fetch(url) pauses execution until the promise resolves. This makes API calls, database queries, and file operations easier to handle in modern web apps.'

        setMemoTitle(sampleTitle)
        setMemoContent(sampleContent)

        return `curl -X POST '${domain}/api/v1/memo/' \\
  -H 'Authorization: Bearer ${apiKey || 'your_api_key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "title": "${sampleTitle}",
  "content": "${sampleContent}"
}'`
    }

    const isDisabled = !apiKey
    const isComplete = memoCreated

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Create your first memo {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">Implement or run the code below to create your first memo</p>

                <div className="code-section">
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <CodeBlock code={getCurlCommand()} language="bash" />
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
