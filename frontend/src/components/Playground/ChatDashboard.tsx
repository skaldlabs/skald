import { useState, useEffect } from 'react'
import { Chat } from './Chat'
import { useProjectStore } from '@/stores/projectStore'
import { useChatStore } from '@/stores/chatStore'
import { useLLMConfigStore } from '@/stores/llmConfigStore'
import { Settings, Cpu, Info } from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { RagConfigForm } from './RagConfigForm'
import { FilterBuilder } from './FilterBuilder'
import { RetrievalInfo } from './RetrievalInfo'
import './Playground.scss'

export const ChatDashboard = () => {
    const { currentProject } = useProjectStore()
    const {
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
    const [isConfigOpen, setIsConfigOpen] = useState(false)

    useEffect(() => {
        fetchProviders()
    }, [fetchProviders])

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
        <div
            className="playground-dashboard"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
        >
            <PageHeader title="Chat">
                <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                </Button>
            </PageHeader>

            <RetrievalInfo variant="chat" />

            <Chat />

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
