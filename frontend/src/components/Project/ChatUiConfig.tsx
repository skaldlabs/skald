import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import type { Project } from '@/lib/types'

interface RAGConfig {
    llmProvider: 'openai' | 'anthropic' | 'local' | 'groq' | 'gemini'
    references: {
        enabled: boolean
    }
    queryRewrite: {
        enabled: boolean
    }
    vectorSearch: {
        topK: number
        similarityThreshold: number
    }
    reranking: {
        enabled: boolean
        topK: number
    }
}

interface ChatUiConfigProps {
    project: Project & {
        chat_ui_enabled?: boolean
        chat_ui_rag_config?: RAGConfig | null
        chat_ui_slug?: string | null
    }
}

export const ChatUiConfig = ({ project }: ChatUiConfigProps) => {
    const updateChatUiConfig = useProjectStore((state) => state.updateChatUiConfig)
    const loading = useProjectStore((state) => state.loading)

    const [chatUiEnabled, setChatUiEnabled] = useState(project.chat_ui_enabled ?? false)
    const [slug, setSlug] = useState(project.chat_ui_slug ?? '')
    const [ragConfig, setRagConfig] = useState<RAGConfig>(
        project.chat_ui_rag_config ?? {
            llmProvider: 'openai',
            references: { enabled: true },
            queryRewrite: { enabled: true },
            vectorSearch: { topK: 10, similarityThreshold: 0.7 },
            reranking: { enabled: true, topK: 5 },
        }
    )

    const [lastSavedState, setLastSavedState] = useState({
        chat_ui_enabled: project.chat_ui_enabled ?? false,
        chat_ui_slug: project.chat_ui_slug ?? '',
        chat_ui_rag_config: project.chat_ui_rag_config,
    })

    const hasChanges =
        chatUiEnabled !== lastSavedState.chat_ui_enabled ||
        slug !== lastSavedState.chat_ui_slug ||
        JSON.stringify(ragConfig) !== JSON.stringify(lastSavedState.chat_ui_rag_config)

    const handleSave = async () => {
        const savedConfig = {
            chat_ui_enabled: chatUiEnabled,
            chat_ui_slug: slug.trim() || null,
            chat_ui_rag_config: chatUiEnabled ? ragConfig : null,
        }
        await updateChatUiConfig(project.uuid, savedConfig)
        // Update last saved state to reset hasChanges
        setLastSavedState({
            chat_ui_enabled: savedConfig.chat_ui_enabled,
            chat_ui_slug: savedConfig.chat_ui_slug ?? '',
            chat_ui_rag_config: savedConfig.chat_ui_rag_config,
        })
    }

    const handleReset = () => {
        const resetEnabled = lastSavedState.chat_ui_enabled
        const resetSlug = lastSavedState.chat_ui_slug
        const resetRagConfig = lastSavedState.chat_ui_rag_config ?? {
            llmProvider: 'openai',
            references: { enabled: true },
            queryRewrite: { enabled: true },
            vectorSearch: { topK: 10, similarityThreshold: 0.7 },
            reranking: { enabled: true, topK: 5 },
        }
        setChatUiEnabled(resetEnabled)
        setSlug(resetSlug)
        setRagConfig(resetRagConfig)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chat UI Configuration</CardTitle>
                <CardDescription>Configure the public chat UI for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="chat-ui-enabled" className="text-base">
                            Enable Chat UI
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Allow public access to a chat interface for this project
                        </p>
                    </div>
                    <Switch
                        id="chat-ui-enabled"
                        checked={chatUiEnabled}
                        onCheckedChange={setChatUiEnabled}
                        disabled={loading}
                    />
                </div>

                {chatUiEnabled && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="chat-ui-slug">Slug</Label>
                            <Input
                                id="chat-ui-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="my-chat-ui"
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">Optional custom slug for the chat UI URL</p>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-sm font-medium">RAG Configuration</h4>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="query-rewrite" className="text-sm">
                                        Query Rewrite
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Rewrite queries for better search results
                                    </p>
                                </div>
                                <Switch
                                    id="query-rewrite"
                                    checked={ragConfig.queryRewrite.enabled}
                                    onCheckedChange={(checked) =>
                                        setRagConfig({
                                            ...ragConfig,
                                            queryRewrite: { ...ragConfig.queryRewrite, enabled: checked },
                                        })
                                    }
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="reranking" className="text-sm">
                                        Reranking
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Re-rank search results for relevance
                                    </p>
                                </div>
                                <Switch
                                    id="reranking"
                                    checked={ragConfig.reranking.enabled}
                                    onCheckedChange={(checked) =>
                                        setRagConfig({
                                            ...ragConfig,
                                            reranking: { ...ragConfig.reranking, enabled: checked },
                                        })
                                    }
                                    disabled={loading}
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
                                        value={ragConfig.vectorSearch.topK}
                                        onChange={(e) => {
                                            const value = Math.max(1, Math.min(200, parseInt(e.target.value) || 1))
                                            setRagConfig({
                                                ...ragConfig,
                                                vectorSearch: { ...ragConfig.vectorSearch, topK: value },
                                            })
                                        }}
                                        className="w-20 h-8"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Number of results to retrieve (1-200)</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="similarity-threshold" className="text-sm font-medium">
                                        Similarity Threshold
                                    </Label>
                                    <span className="text-sm font-mono">
                                        {ragConfig.vectorSearch.similarityThreshold.toFixed(2)}
                                    </span>
                                </div>
                                <Slider
                                    id="similarity-threshold"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={[ragConfig.vectorSearch.similarityThreshold]}
                                    onValueChange={([value]) =>
                                        setRagConfig({
                                            ...ragConfig,
                                            vectorSearch: {
                                                ...ragConfig.vectorSearch,
                                                similarityThreshold: value,
                                            },
                                        })
                                    }
                                    disabled={loading}
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
                                        value={ragConfig.reranking.topK}
                                        onChange={(e) => {
                                            const value = Math.max(
                                                1,
                                                Math.min(
                                                    100,
                                                    Math.min(ragConfig.vectorSearch.topK, parseInt(e.target.value) || 1)
                                                )
                                            )
                                            setRagConfig({
                                                ...ragConfig,
                                                reranking: { ...ragConfig.reranking, topK: value },
                                            })
                                        }}
                                        className="w-20 h-8"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Number of results after reranking (1-100, ≤ vector top K)
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="enable-references" className="text-sm">
                                        Enable Source References
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show [X] reference links in chat responses
                                    </p>
                                </div>
                                <Switch
                                    id="enable-references"
                                    checked={ragConfig.references.enabled}
                                    onCheckedChange={(checked) =>
                                        setRagConfig({
                                            ...ragConfig,
                                            references: { ...ragConfig.references, enabled: checked },
                                        })
                                    }
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </>
                )}

                {hasChanges && (
                    <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button onClick={handleReset} variant="outline" disabled={loading}>
                            Reset
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
