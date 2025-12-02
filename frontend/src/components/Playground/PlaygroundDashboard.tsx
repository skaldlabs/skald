import { useState, useEffect } from 'react'
import { ChatMessagesList } from './ChatMessagesList'
import { ChatInput } from './ChatInput'
import { useProjectStore } from '@/stores/projectStore'
import { useChatStore } from '@/stores/chatStore'
import { useLLMConfigStore } from '@/stores/llmConfigStore'
import { useMemoStore } from '@/stores/memoStore'
import {
    Info,
    Settings,
    Cpu,
    Search,
    Brain,
    ChevronDown,
    ChevronUp,
    PenLine,
    ArrowUpDown,
    Layers,
    History,
    Quote,
} from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { RagConfigForm } from './RagConfigForm'
import { FilterBuilder } from './FilterBuilder'
import './Playground.scss'

const retrievalSteps = [
    {
        icon: PenLine,
        title: 'Query Rewriting',
        description: 'Optimizes your question for better retrieval',
    },
    {
        icon: Search,
        title: 'Vector Search',
        description: 'Finds relevant chunks using semantic similarity',
    },
    {
        icon: ArrowUpDown,
        title: 'Re-ranking',
        description: 'Reorders results by relevance to your query',
    },
    {
        icon: Layers,
        title: 'Context Assembly',
        description: 'Combines the best chunks into coherent context',
    },
    {
        icon: Brain,
        title: 'LLM Interaction',
        description: 'Generates response using assembled context',
    },
    {
        icon: History,
        title: 'Chat Memory',
        description: 'Maintains conversation history for continuity',
    },
    {
        icon: Quote,
        title: 'Source Citations',
        description: 'References original documents in responses',
    },
]

export const PlaygroundDashboard = () => {
    const { currentProject } = useProjectStore()
    const {
        messages,
        systemPrompt,
        setSystemPrompt,
        llmProvider,
        setLlmProvider,
        ragConfig,
        setRagConfig,
        filters,
        addFilter,
        updateFilter,
        removeFilter,
    } = useChatStore()
    const { availableProviders, fetchProviders } = useLLMConfigStore()
    const { memos, fetchMemos, loading: memosLoading } = useMemoStore()
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [showRetrievalInfo, setShowRetrievalInfo] = useState(false)
    const [hasInitializedRetrievalInfo, setHasInitializedRetrievalInfo] = useState(false)

    useEffect(() => {
        fetchProviders()
    }, [fetchProviders])

    useEffect(() => {
        if (currentProject) {
            fetchMemos()
        }
    }, [currentProject, fetchMemos])

    // Auto-expand retrieval info if no memos exist
    useEffect(() => {
        if (!memosLoading && !hasInitializedRetrievalInfo && memos.length === 0) {
            setShowRetrievalInfo(true)
            setHasInitializedRetrievalInfo(true)
        }
    }, [memosLoading, memos.length, hasInitializedRetrievalInfo])

    useEffect(() => {
        if (messages.length > 0) {
            setShowRetrievalInfo(false)
        }
    }, [messages.length])

    // Set default provider when providers are loaded
    useEffect(() => {
        if (availableProviders.length > 0 && !llmProvider) {
            setLlmProvider(availableProviders[0].provider)
        }
    }, [availableProviders, llmProvider, setLlmProvider])

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
            <PageHeader title="Retrieval">
                <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                </Button>
            </PageHeader>

            {/* Retrieval Explanation Section */}
            <div className="rounded-lg border bg-card p-4 mb-4">
                <button
                    onClick={() => setShowRetrievalInfo(!showRetrievalInfo)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <div>
                        <h3 className="text-sm font-medium text-foreground">What is Retrieval?</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Test your knowledge base with{' '}
                            <span className="font-medium text-foreground">RAG-powered</span> conversations. Ask
                            questions and get answers grounded in your ingested data.
                        </p>
                    </div>
                    {showRetrievalInfo ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                    )}
                </button>

                {showRetrievalInfo && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3">
                            We handle the complete RAG pipeline for you:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                            {retrievalSteps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="relative flex flex-col items-center text-center p-3 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors"
                                >
                                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-2">
                                        <step.icon className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-medium text-foreground leading-tight">{step.title}</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="chat-container">
                <ChatMessagesList />
                <ChatInput />
            </div>

            <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[500px] sm:max-w-none overflow-y-auto">
                    <div className="space-y-6 p-8">
                        <h3 className="text-lg font-semibold">Settings</h3>

                        {availableProviders.length > 0 && (
                            <div className="llm-provider-selector">
                                <label htmlFor="llm-provider" className="block text-sm font-medium mb-2">
                                    LLM Provider
                                </label>
                                <div className="mb-4">
                                    <small className="text-xs text-gray-500 mb-4">
                                        Currently we select the model for you based on the LLM provider but soon you'll
                                        be able to configure your model of choice as well.
                                    </small>
                                </div>
                                <Select value={llmProvider} onValueChange={setLlmProvider}>
                                    <SelectTrigger id="llm-provider" className="w-full">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="h-4 w-4" />
                                            <SelectValue placeholder="Select LLM provider" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProviders.map((provider) => (
                                            <SelectItem key={provider.provider} value={provider.provider}>
                                                {provider.label} ({provider.model})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="system-prompt-container">
                            <label htmlFor="system-prompt" className="block text-sm font-medium mb-2">
                                System prompt
                            </label>
                            <Textarea
                                id="system-prompt"
                                placeholder="Enter a custom system prompt to guide the AI's responses e.g. 'You're a helpful support assistant, reply using standard English but don't be too formal'"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="border-t pt-6">
                            <FilterBuilder
                                filters={filters}
                                onAddFilter={addFilter}
                                onUpdateFilter={updateFilter}
                                onRemoveFilter={removeFilter}
                            />
                        </div>

                        <div className="border-t pt-6">
                            <h4 className="text-md font-semibold mb-4">RAG Configuration (Advanced)</h4>
                            <RagConfigForm ragConfig={ragConfig} onChange={setRagConfig} />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
