import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2, Pencil, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/lib/types'
import { Switch } from '@/components/ui/switch'

interface ProjectNameEditorProps {
    project: Project
}

export const ProjectEditor = ({ project }: ProjectNameEditorProps) => {
    const updateProject = useProjectStore((state) => state.updateProject)
    const loading = useProjectStore((state) => state.loading)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')

    const handleStartEdit = () => {
        setEditedName(project.name)
        setIsEditingName(true)
    }

    const handleCancelEdit = () => {
        setIsEditingName(false)
        setEditedName('')
    }

    const handleSaveEdit = async () => {
        if (!editedName.trim()) {
            return
        }
        await updateProject(project.uuid, { name: editedName.trim() })
        setIsEditingName(false)
        setEditedName('')
    }

    const handleToggle = async (checked: boolean) => {
        await updateProject(project.uuid, { query_rewrite_enabled: checked })
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Enter project name"
                            disabled={loading}
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveEdit()
                                } else if (e.key === 'Escape') {
                                    handleCancelEdit()
                                }
                            }}
                            autoFocus
                        />
                        <Button
                            onClick={handleSaveEdit}
                            disabled={loading || !editedName.trim()}
                            size="icon"
                            variant="default"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button onClick={handleCancelEdit} disabled={loading} size="icon" variant="outline">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{project.name}</p>
                        </div>
                        <Button onClick={handleStartEdit} variant="outline" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                )}
                <div className="mt-6 flex justify-between gap-4 items-center">
                    <div>
                        <p className="text-sm font-medium leading-tight">Query Rewrite</p>
                        <p className="text-sm text-muted-foreground">
                            Improves retrieval by letting the agent rephrase user questions before searching your memos.
                        </p>
                    </div>
                    <Switch
                        id="query-rewrite"
                        checked={project.query_rewrite_enabled}
                        onCheckedChange={handleToggle}
                        disabled={loading}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
