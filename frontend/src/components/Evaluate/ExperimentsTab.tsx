import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { CreateExperimentDialog } from './CreateExperimentDialog'
import { ExperimentDetailView } from './ExperimentDetailView'
import { api, getProjectPath } from '@/lib/api'

interface Experiment {
    uuid: string
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
    created_at: string
}

export const ExperimentsTab = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([])
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedExperimentUuid, setSelectedExperimentUuid] = useState<string | null>(null)

    const fetchExperiments = async () => {
        setIsLoading(true)
        try {
            const projectPath = getProjectPath()
            const response = await api.get<Experiment[]>(`${projectPath}/experiments`)
            if (response.data) {
                setExperiments(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch experiments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchExperiments()
    }, [])

    const handleExperimentCreated = () => {
        setIsCreateDialogOpen(false)
        fetchExperiments()
    }

    const handleExperimentClick = (experimentUuid: string) => {
        setSelectedExperimentUuid(experimentUuid)
    }

    const handleBackToList = () => {
        setSelectedExperimentUuid(null)
    }

    // If an experiment is selected, show the detail view
    if (selectedExperimentUuid) {
        return <ExperimentDetailView experimentUuid={selectedExperimentUuid} onBack={handleBackToList} />
    }

    return (
        <div className="experiments-tab p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Experiments</h2>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Experiment
                </Button>
            </div>

            {isLoading ? (
                <div className="text-muted-foreground">Loading experiments...</div>
            ) : experiments.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                    No experiments yet. Create your first experiment to get started.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {experiments.map((experiment) => (
                            <TableRow
                                key={experiment.uuid}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleExperimentClick(experiment.uuid)}
                            >
                                <TableCell className="font-medium">{experiment.title}</TableCell>
                                <TableCell>{experiment.description}</TableCell>
                                <TableCell>{new Date(experiment.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <CreateExperimentDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onExperimentCreated={handleExperimentCreated}
            />
        </div>
    )
}
