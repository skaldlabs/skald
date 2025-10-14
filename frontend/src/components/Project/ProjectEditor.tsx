import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2, Pencil, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/lib/types'

interface ProjectNameEditorProps {
    project: Project
}

export const ProjectEditor = ({ project }: ProjectNameEditorProps) => {
    const updateProject = useProjectStore((state) => state.updateProject)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

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

        setIsSaving(true)
        await updateProject(project.uuid, editedName.trim())
        setIsSaving(false)
        setIsEditingName(false)
        setEditedName('')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Enter project name"
                            disabled={isSaving}
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
                            disabled={isSaving || !editedName.trim()}
                            size="icon"
                            variant="default"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button onClick={handleCancelEdit} disabled={isSaving} size="icon" variant="outline">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-medium">{project.name}</p>
                        </div>
                        <Button onClick={handleStartEdit} variant="outline" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
