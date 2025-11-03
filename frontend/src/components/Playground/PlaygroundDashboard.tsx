import { useState } from 'react'
import { ChatMessagesList } from './ChatMessagesList'
import { ChatInput } from './ChatInput'
import { useProjectStore } from '@/stores/projectStore'
import { useChatStore } from '@/stores/chatStore'
import { Info, ChevronDown, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import './Playground.scss'

export const PlaygroundDashboard = () => {
    const { currentProject } = useProjectStore()
    const { systemPrompt, setSystemPrompt } = useChatStore()
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)

    if (!currentProject) {
        return (
            <div className="playground-dashboard">
                <div className="no-project-alert">
                    <Info className="h-4 w-4" />
                    <p>Please select a project to start chatting with your data.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="playground-dashboard">
            <PageHeader title="Playground" />
            <Alert className="my-4 [&>svg]:top-3">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    We don't currently support chat history, so each of your messages in this chat is independent from
                    others. We're adding support for chat history this week.
                </AlertDescription>
            </Alert>
            <div className="system-prompt-container mb-4">
                <Button
                    variant="ghost"
                    onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                    className="mb-2 p-0 h-auto font-medium text-sm hover:bg-transparent"
                >
                    {isSystemPromptOpen ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    System Prompt (optional)
                </Button>
                {isSystemPromptOpen && (
                    <Textarea
                        id="system-prompt"
                        placeholder="Enter a custom system prompt to guide the AI's responses e.g. 'You're a helpful support assistant, reply using standard English but don't be too formal'"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="min-h-[80px]"
                    />
                )}
            </div>
            <div className="chat-container">
                <ChatMessagesList />
                <ChatInput />
            </div>
        </div>
    )
}
