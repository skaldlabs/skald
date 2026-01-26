import { useState } from 'react'
import { Plus, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { ScopeEntry } from '@/stores/chatStore'

interface ScopesBuilderProps {
    scopes: ScopeEntry[]
    onAddScope: (key: string, value: string) => void
    onUpdateScope: (id: string, key: string, value: string) => void
    onRemoveScope: (id: string) => void
}

export const ScopesBuilder = ({ scopes, onAddScope, onRemoveScope }: ScopesBuilderProps) => {
    const [scopeKey, setScopeKey] = useState('')
    const [scopeValue, setScopeValue] = useState('')

    const handleAddScope = () => {
        if (scopeKey.trim() && scopeValue.trim()) {
            onAddScope(scopeKey.trim(), scopeValue.trim())
            setScopeKey('')
            setScopeValue('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddScope()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Label className="text-base">Scopes</Label>
            </div>

            <p className="text-sm text-muted-foreground">
                Filter retrieval results by scope key-value pairs. Only memos with matching scopes will be included.
            </p>

            <div className="flex gap-2">
                <Input
                    placeholder="Key"
                    value={scopeKey}
                    onChange={(e) => setScopeKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />
                <Input
                    placeholder="Value"
                    value={scopeValue}
                    onChange={(e) => setScopeValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddScope}
                    disabled={!scopeKey.trim() || !scopeValue.trim()}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {scopes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {scopes.map((scope) => (
                        <Badge key={scope.id} variant="secondary" className="gap-1 py-1.5 px-3">
                            <Shield className="h-3 w-3" />
                            <span className="font-medium">{scope.key}</span>
                            <span className="text-muted-foreground">:</span>
                            <span>{scope.value}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveScope(scope.id)}
                                className="ml-1 hover:bg-muted rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    )
}
