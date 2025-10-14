import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { CodeBlock } from './CodeBlock'
import { domain } from '@/lib/api'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/projectStore'
import './GettingStarted.scss'

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    const name = 'csrftoken'
    let cookieValue = null
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

interface CreateMemoStepProps {
    apiKey: string | null
}

export const CreateMemoStep = ({ apiKey }: CreateMemoStepProps) => {
    const { currentProject } = useProjectStore()
    const [activeTab, setActiveTab] = useState('curl')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [memoCreated, setMemoCreated] = useState(false)

    const generateSampleMemo = () => {
        setTitle('My First Memo')
        setContent(
            'This is my first memo created using the Skald API. It will be automatically processed, chunked, and made searchable!'
        )
    }

    const handleCreateMemo = async () => {
        if (!apiKey || !currentProject) {
            toast.error('Please generate an API key first')
            return
        }

        if (!title.trim() || !content.trim()) {
            toast.error('Please provide both title and content')
            return
        }

        setIsCreating(true)
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            }

            const csrfToken = getCsrfToken()
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken
            }

            const response = await fetch(`${domain}/api/v1/memo/`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    content,
                    project_id: currentProject.uuid,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create memo')
            }

            toast.success('Memo created successfully!')
            setMemoCreated(true)
            setTitle('')
            setContent('')
        } catch (error) {
            toast.error('Failed to create memo')
            console.error(error)
        } finally {
            setIsCreating(false)
        }
    }

    const getCurlCommand = () => {
        const sampleTitle = title || 'My First Memo'
        const sampleContent = content || 'This is the content of my first memo.'

        return `curl -X POST '${domain}/api/v1/memo/' \\
  -H 'Authorization: Bearer ${apiKey || 'your_api_key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "title": "${sampleTitle}",
  "content": "${sampleContent}",
  "project_id": "${currentProject?.uuid || 'your_project_id'}"
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
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter memo title"
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="form-field">
                        <label>Content</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter memo content"
                            rows={4}
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="button-group">
                        <Button variant="outline" onClick={generateSampleMemo} disabled={isDisabled}>
                            Auto-fill sample
                        </Button>
                        <Button
                            onClick={handleCreateMemo}
                            disabled={isDisabled || isCreating || !title.trim() || !content.trim()}
                        >
                            {isCreating ? 'Creating...' : 'Create memo'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
