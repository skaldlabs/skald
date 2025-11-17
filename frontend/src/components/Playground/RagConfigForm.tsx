import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

export interface RagConfig {
    queryRewriteEnabled: boolean
    rerankingEnabled: boolean
    vectorSearchTopK: number
    similarityThreshold: number
    rerankingTopK: number
    referencesEnabled: boolean
}

interface RagConfigFormProps {
    ragConfig: RagConfig
    onChange: (config: Partial<RagConfig>) => void
}

export const RagConfigForm = ({ ragConfig, onChange }: RagConfigFormProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="query-rewrite" className="text-base">
                        Query Rewrite
                    </Label>
                    <p className="text-sm text-muted-foreground">Rewrite queries for better search results</p>
                </div>
                <Switch
                    id="query-rewrite"
                    checked={ragConfig.queryRewriteEnabled}
                    onCheckedChange={(checked) => onChange({ queryRewriteEnabled: checked })}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="reranking" className="text-base">
                        Reranking
                    </Label>
                    <p className="text-sm text-muted-foreground">Re-rank search results for relevance</p>
                </div>
                <Switch
                    id="reranking"
                    checked={ragConfig.rerankingEnabled}
                    onCheckedChange={(checked) => onChange({ rerankingEnabled: checked })}
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
                            onChange({ vectorSearchTopK: value })
                        }}
                        className="w-20 h-8"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Number of results to retrieve (1-200)</p>
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
                    onValueChange={([value]) => onChange({ similarityThreshold: value })}
                />
                <p className="text-xs text-muted-foreground">Minimum similarity score for results (0-1)</p>
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
                            const value = Math.max(
                                1,
                                Math.min(100, Math.min(ragConfig.vectorSearchTopK, parseInt(e.target.value) || 1))
                            )
                            onChange({ rerankingTopK: value })
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
                    <p className="text-sm text-muted-foreground">Show [X] reference links in chat responses</p>
                </div>
                <Switch
                    id="enable-references"
                    checked={ragConfig.referencesEnabled}
                    onCheckedChange={(checked) => onChange({ referencesEnabled: checked })}
                />
            </div>
        </div>
    )
}
