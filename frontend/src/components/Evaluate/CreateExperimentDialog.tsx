import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, getProjectPath } from '@/lib/api'

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
    const [propertiesJson, setPropertiesJson] = useState('{}')
    const [datasets, setDatasets] = useState<EvaluationDataset[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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

        let properties: Record<string, any>
        try {
            properties = JSON.parse(propertiesJson)
        } catch (err) {
            setError('Invalid JSON in properties field')
            return
        }

        setIsLoading(true)

        try {
            const projectPath = getProjectPath()
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
                setPropertiesJson('{}')
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

                    <div className="space-y-2">
                        <Label htmlFor="properties">Properties (JSON)</Label>
                        <Textarea
                            id="properties"
                            value={propertiesJson}
                            onChange={(e) => setPropertiesJson(e.target.value)}
                            placeholder='{"model": "gpt-4", "temperature": 0.7}'
                            className="min-h-[100px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter experiment configuration as JSON (e.g., model parameters, settings)
                        </p>
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
