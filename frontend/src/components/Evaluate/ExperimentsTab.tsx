import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { CreateExperimentDialog } from './CreateExperimentDialog'
import { ExperimentDetailView } from './ExperimentDetailView'
import { useEvaluateExperimentsStore } from '@/stores/evaluateExperimentsStore'

export const ExperimentsTab = () => {
    const { experiments, loading, fetchExperiments } = useEvaluateExperimentsStore()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [selectedExperimentUuid, setSelectedExperimentUuid] = useState<string | null>(null)

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

            {loading ? (
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
                            <TableHead>Dataset</TableHead>
                            <TableHead>Avg Total Time (ms)</TableHead>
                            <TableHead>Avg TTFT (ms)</TableHead>
                            <TableHead>Avg LLM Rating</TableHead>
                            <TableHead>Avg Human Rating</TableHead>
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
                                <TableCell>{experiment.evaluation_dataset_name}</TableCell>
                                <TableCell>
                                    {experiment.statistics.average_total_answer_time_ms !== null
                                        ? Math.round(
                                              experiment.statistics.average_total_answer_time_ms
                                          ).toLocaleString()
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    {experiment.statistics.average_time_to_first_token_ms !== null
                                        ? Math.round(
                                              experiment.statistics.average_time_to_first_token_ms
                                          ).toLocaleString()
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    {experiment.statistics.average_llm_answer_rating !== null
                                        ? experiment.statistics.average_llm_answer_rating.toFixed(2)
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    {experiment.statistics.average_human_answer_rating !== null
                                        ? experiment.statistics.average_human_answer_rating.toFixed(2)
                                        : '-'}
                                </TableCell>
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
