import { useEffect, useRef } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export const MemoCreationStep = () => {
    const user = useAuthStore((state) => state.user)
    const memoTitle = useOnboardingStore((state) => state.memoTitle)
    const memoContent = useOnboardingStore((state) => state.memoContent)
    const isCreatingMemo = useOnboardingStore((state) => state.isCreatingMemo)
    const setMemoTitle = useOnboardingStore((state) => state.setMemoTitle)
    const setMemoContent = useOnboardingStore((state) => state.setMemoContent)
    const createMemo = useOnboardingStore((state) => state.createMemo)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Set default template on mount if empty
    useEffect(() => {
        if (!memoContent && user?.organization_name) {
            const defaultTemplate = `About ${user.organization_name}

${user.organization_name} is a company that...

[Describe what your organization does, your main products or services, and what makes you unique]`

            setMemoTitle(`About ${user.organization_name}`)
            setMemoContent(defaultTemplate)
        }
    }, [user?.organization_name, memoContent, setMemoTitle, setMemoContent])

    // Auto-focus textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus()
            // Move cursor to end
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
        }
    }, [])

    const handleCreate = () => {
        createMemo()
    }

    const isValid = memoTitle.trim().length > 0 && memoContent.trim().length > 20

    return (
        <div className="memo-creation-step">
            <h1>Let's create your first memo</h1>
            <p className="explanation">
                Memos are pieces of knowledge that power your AI agent. They can be documents, notes, or any text
                content. Once processed, they become searchable and can be used to answer questions.
            </p>

            <div className="template-editor">
                <label htmlFor="memo-title" className="label">
                    Title
                </label>
                <input
                    id="memo-title"
                    type="text"
                    value={memoTitle}
                    onChange={(e) => setMemoTitle(e.target.value)}
                    placeholder="Give your memo a title"
                    className="title-input"
                />

                <label htmlFor="memo-content" className="label mt-4">
                    Content
                </label>
                <Textarea
                    ref={textareaRef}
                    id="memo-content"
                    value={memoContent}
                    onChange={(e) => setMemoContent(e.target.value)}
                    placeholder="Write or paste your content here..."
                    className="content-textarea"
                />

                <div className="helper-text">
                    💡 Tip: Describe your organization, product, or any knowledge you want your AI agent to know about.
                </div>
            </div>

            <Button onClick={handleCreate} disabled={!isValid || isCreatingMemo} size="lg" className="create-button">
                {isCreatingMemo ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                    </>
                ) : (
                    'Create My First Memo'
                )}
            </Button>
        </div>
    )
}
