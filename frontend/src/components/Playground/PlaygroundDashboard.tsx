import { useState } from 'react'
import { ChatMessagesList } from './ChatMessagesList'
import { ChatInput } from './ChatInput'
import { useProjectStore } from '@/stores/projectStore'
import { useChatStore } from '@/stores/chatStore'
import { Info, Settings, Cpu } from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import './Playground.scss'
import { isSelfHostedDeploy } from '@/config'

const LLM_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'groq', label: 'Groq' },
]

export const PlaygroundDashboard = () => {
    const { currentProject } = useProjectStore()
    const { systemPrompt, setSystemPrompt, llmProvider, setLlmProvider, ragConfig, setRagConfig } = useChatStore()
    const [isConfigOpen, setIsConfigOpen] = useState(false)

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
            <PageHeader title="Playground">
                <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                </Button>
            </PageHeader>

            <div className="chat-container">
                <ChatMessagesList />
                <ChatInput />
            </div>

            <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[500px] sm:max-w-none overflow-y-auto">
                    <div className="space-y-6 p-8">
                        <h3 className="text-lg font-semibold">Settings</h3>

                        {!isSelfHostedDeploy ? (
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
                                        {LLM_PROVIDERS.map((provider) => (
                                            <SelectItem key={provider.value} value={provider.value}>
                                                {provider.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

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
                            <h4 className="text-md font-semibold mb-4">RAG Configuration (Advanced)</h4>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="query-rewrite" className="text-base">
                                            Query Rewrite
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Rewrite queries for better search results
                                        </p>
                                    </div>
                                    <Switch
                                        id="query-rewrite"
                                        checked={ragConfig.queryRewriteEnabled}
                                        onCheckedChange={(checked) => setRagConfig({ queryRewriteEnabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="reranking" className="text-base">
                                            Reranking
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Re-rank search results for relevance
                                        </p>
                                    </div>
                                    <Switch
                                        id="reranking"
                                        checked={ragConfig.rerankingEnabled}
                                        onCheckedChange={(checked) => setRagConfig({ rerankingEnabled: checked })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="vector-top-k" className="text-sm font-medium">
                                            Vector Search Top K
                                        </Label>
                                        <Input
                                            id="vector-top-k"
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={ragConfig.vectorSearchTopK}
                                            onChange={(e) => {
                                                const value = Math.max(1, Math.min(200, parseInt(e.target.value) || 1))
                                                setRagConfig({ vectorSearchTopK: value })
                                            }}
                                            className="w-20 h-8"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Number of results to retrieve (1-200)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="similarity-threshold" className="text-sm font-medium">
                                            Similarity Threshold
                                        </Label>
                                        <span className="text-sm font-mono">{ragConfig.similarityThreshold.toFixed(2)}</span>
                                    </div>
                                    <Slider
                                        id="similarity-threshold"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={[ragConfig.similarityThreshold]}
                                        onValueChange={([value]) => setRagConfig({ similarityThreshold: value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum similarity score for results (0-1)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="reranking-top-k" className="text-sm font-medium">
                                            Reranking Top K
                                        </Label>
                                        <Input
                                            id="reranking-top-k"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={ragConfig.rerankingTopK}
                                            onChange={(e) => {
                                                const value = Math.max(1, Math.min(100, Math.min(ragConfig.vectorSearchTopK, parseInt(e.target.value) || 1)))
                                                setRagConfig({ rerankingTopK: value })
                                            }}
                                            className="w-20 h-8"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Number of results after reranking (1-100, ≤ vector top K)
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable-references" className="text-base">
                                            Enable Source References
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Show [X] reference links in chat responses
                                        </p>
                                    </div>
                                    <Switch
                                        id="enable-references"
                                        checked={ragConfig.referencesEnabled}
                                        onCheckedChange={(checked) => setRagConfig({ referencesEnabled: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
