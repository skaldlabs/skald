import { useState } from 'react'
import { ChatMessagesList } from './ChatMessagesList'
import { ChatInput } from './ChatInput'
import { useProjectStore } from '@/stores/projectStore'
import { useChatStore } from '@/stores/chatStore'
import { Info, ChevronDown, ChevronRight, Cpu } from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import './Playground.scss'

const LLM_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'groq', label: 'Groq' },
]

export const PlaygroundDashboard = () => {
    const { currentProject } = useProjectStore()
    const { systemPrompt, setSystemPrompt, llmProvider, setLlmProvider } = useChatStore()
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
            <div className="mb-4 space-y-4">
                <div className="llm-provider-selector">
                    <label htmlFor="llm-provider" className="block text-sm font-medium mb-2">
                        LLM Provider
                    </label>
                    <Select value={llmProvider} onValueChange={setLlmProvider}>
                        <SelectTrigger id="llm-provider" className="w-full max-w-xs">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4" />
                                <SelectValue placeholder="Select LLM provider" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {LLM_PROVIDERS.map((provider) => (
                                <SelectItem key={provider.value} value={provider.value}>
                                    {provider.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="system-prompt-container">
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
            </div>
            <div className="chat-container">
                <ChatMessagesList />
                <ChatInput />
            </div>
        </div>
    )
}
