import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, getProjectPath } from '@/lib/api'
import { RagConfigForm, type RagConfig } from '@/components/Playground/RagConfigForm'
import { Cpu } from 'lucide-react'
import { isSelfHostedDeploy } from '@/config'

const LLM_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'groq', label: 'Groq' },
]

interface EvaluationDataset {
    uuid: string
    name: string
    description: string
}

interface CreateExperimentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onExperimentCreated: () => void
}

export const CreateExperimentDialog = ({ open, onOpenChange, onExperimentCreated }: CreateExperimentDialogProps) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedDatasetUuid, setSelectedDatasetUuid] = useState<string>('')
    const [datasets, setDatasets] = useState<EvaluationDataset[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [llmProvider, setLlmProvider] = useState('openai')
    const [ragConfig, setRagConfig] = useState<RagConfig>({
        queryRewriteEnabled: false,
        rerankingEnabled: true,
        vectorSearchTopK: 50,
        similarityThreshold: 0.8,
        rerankingTopK: 25,
        referencesEnabled: false,
    })

    useEffect(() => {
        if (open) {
            fetchDatasets()
        }
    }, [open])

    const fetchDatasets = async () => {
        try {
            const projectPath = getProjectPath()
            const response = await api.get<EvaluationDataset[]>(`${projectPath}/evaluation-datasets`)
            if (response.data) {
                setDatasets(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!title || !description || !selectedDatasetUuid) {
            setError('Please fill in all required fields')
            return
        }

        setIsLoading(true)

        try {
            const projectPath = getProjectPath()

            // Convert ragConfig to the backend format
            const properties: Record<string, any> = {
                rag_config: {
                    llm_provider: llmProvider,
                    query_rewrite: { enabled: ragConfig.queryRewriteEnabled },
                    reranking: { enabled: ragConfig.rerankingEnabled, top_k: ragConfig.rerankingTopK },
                    vector_search: {
                        top_k: ragConfig.vectorSearchTopK,
                        similarity_threshold: ragConfig.similarityThreshold,
                    },
                    references: { enabled: ragConfig.referencesEnabled },
                },
            }

            // Add system prompt if provided
            if (systemPrompt.trim()) {
                properties.client_system_prompt = systemPrompt.trim()
            }

            const response = await api.post(`${projectPath}/experiments`, {
                title,
                description,
                properties,
                evaluation_dataset_uuid: selectedDatasetUuid,
            })

            if (response.error) {
                setError(response.error)
            } else {
                // Reset form
                setTitle('')
                setDescription('')
                setSelectedDatasetUuid('')
                setSystemPrompt('')
                setLlmProvider('openai')
                setRagConfig({
                    queryRewriteEnabled: false,
                    rerankingEnabled: true,
                    vectorSearchTopK: 50,
                    similarityThreshold: 0.8,
                    rerankingTopK: 25,
                    referencesEnabled: false,
                })
                onExperimentCreated()
            }
        } catch (error) {
            console.error('Failed to create experiment:', error)
            setError('Failed to create experiment')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Experiment</DialogTitle>
                    <DialogDescription>
                        Create a new experiment to test your model with an evaluation dataset.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Experiment title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your experiment"
                            className="min-h-[80px]"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dataset">Evaluation Dataset *</Label>
                        <Select value={selectedDatasetUuid} onValueChange={setSelectedDatasetUuid}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a dataset" />
                            </SelectTrigger>
                            <SelectContent>
                                {datasets.map((dataset) => (
                                    <SelectItem key={dataset.uuid} value={dataset.uuid}>
                                        {dataset.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold mb-4">Configuration</h4>

                        <div className="space-y-4 mb-6">
                            {!isSelfHostedDeploy && (
                                <div className="space-y-2">
                                    <Label htmlFor="llm-provider">LLM Provider</Label>
                                    <Select value={llmProvider} onValueChange={setLlmProvider}>
                                        <SelectTrigger id="llm-provider">
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
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="system-prompt">System Prompt</Label>
                                <Textarea
                                    id="system-prompt"
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Enter a custom system prompt to guide the AI's responses (optional)"
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>

                        <h4 className="text-md font-semibold mb-4">RAG Configuration</h4>
                        <RagConfigForm
                            ragConfig={ragConfig}
                            onChange={(config) => setRagConfig({ ...ragConfig, ...config })}
                        />
                    </div>

                    {error && <div className="text-sm text-red-500">{error}</div>}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Experiment'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
