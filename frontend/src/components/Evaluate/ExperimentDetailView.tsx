import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronDown, Play, ChevronRight, InfoIcon } from 'lucide-react'
import { useEvaluateExperimentsStore, type ExperimentResult } from '@/stores/evaluateExperimentsStore'
import { useEvaluateDatasetsStore } from '@/stores/evaluateDatasetsStore'
import { ExperimentResultModal } from './ExperimentResultModal'

interface ExperimentDetailViewProps {
    experimentUuid: string
    onBack: () => void
}

export const ExperimentDetailView = ({ experimentUuid, onBack }: ExperimentDetailViewProps) => {
    const { currentExperiment, results, loading, fetchExperiment, fetchExperimentResults, runExperiment } =
        useEvaluateExperimentsStore()
    const { currentDataset, fetchDataset } = useEvaluateDatasetsStore()
    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState({ completed: 0, total: 0 })
    const [runError, setRunError] = useState<string | null>(null)
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
    const [selectedResult, setSelectedResult] = useState<ExperimentResult | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchExperiment(experimentUuid), fetchExperimentResults(experimentUuid)])

            // Fetch dataset questions if experiment is loaded
            const experiment = useEvaluateExperimentsStore.getState().currentExperiment
            if (experiment?.evaluation_dataset_uuid) {
                await fetchDataset(experiment.evaluation_dataset_uuid)
            }
        }

        fetchData()
    }, [experimentUuid, fetchExperiment, fetchExperimentResults, fetchDataset])

    const handleResultClick = (result: ExperimentResult) => {
        setSelectedResult(result)
        setIsModalOpen(true)
    }

    const handleRunExperimentClick = () => {
        setIsConfirmDialogOpen(true)
    }

    const handleConfirmRun = async () => {
        setIsConfirmDialogOpen(false)
        await handleRunExperiment()
    }

    const handleRunExperiment = async () => {
        if (!currentExperiment || !currentDataset?.questions.length) return

        setIsRunning(true)
        setRunError(null)
        setProgress({ completed: 0, total: currentDataset.questions.length })

        const BATCH_SIZE = 5

        try {
            for (let i = 0; i < currentDataset.questions.length; i += BATCH_SIZE) {
                const batch = currentDataset.questions.slice(i, i + BATCH_SIZE)

                await Promise.all(
                    batch.map(async (question) => {
                        try {
                            await runExperiment(experimentUuid, {
                                evaluation_dataset_question_uuid: question.uuid,
                            })
                            setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }))
                        } catch (err) {
                            console.error(`Failed to run question ${question.uuid}:`, err)
                        }
                    })
                )
            }

            // Fetch updated results
            await fetchExperimentResults(experimentUuid)
        } catch (err) {
            console.error('Failed to run experiment:', err)
            setRunError('Failed to run experiment')
        } finally {
            setIsRunning(false)
        }
    }

    if (loading) {
        return (
            <div className="p-4">
                <div className="text-muted-foreground">Loading experiment...</div>
            </div>
        )
    }

    if (!currentExperiment) {
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to experiments list
                </Button>
                <div className="text-red-500">Experiment not found</div>
            </div>
        )
    }

    const questions = currentDataset?.questions || []

    return (
        <div className="p-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to experiments list
            </Button>

            <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{currentExperiment.title}</h2>
                        <p className="text-muted-foreground mb-2">{currentExperiment.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Created: {new Date(currentExperiment.created_at).toLocaleDateString()}</span>
                            {currentExperiment.evaluation_dataset_name && (
                                <>
                                    <span>•</span>
                                    <span>Dataset: {currentExperiment.evaluation_dataset_name}</span>
                                </>
                            )}
                            <span>•</span>
                            <span>{questions.length} questions</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleRunExperimentClick}
                        disabled={isRunning || questions.length === 0 || results.length > 0}
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {results.length > 0 ? 'Experiment Complete' : isRunning ? 'Running...' : 'Run Experiment'}
                    </Button>
                </div>

                {isRunning && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span>Running experiment...</span>
                            <span>
                                {progress.completed} / {progress.total}
                            </span>
                        </div>
                        <Progress value={(progress.completed / progress.total) * 100} />
                    </div>
                )}

                {runError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                        {runError}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {(() => {
                    // Handle properties whether they're an object or a JSON string
                    let props: Record<string, any>
                    try {
                        props =
                            typeof currentExperiment.properties === 'string'
                                ? JSON.parse(currentExperiment.properties)
                                : currentExperiment.properties
                    } catch {
                        return (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Properties</h3>
                                <p className="text-sm text-red-500">Invalid properties format</p>
                            </div>
                        )
                    }

                    if (!props || Object.keys(props).length === 0) {
                        return (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Properties</h3>
                                <p className="text-sm text-muted-foreground">No properties defined</p>
                            </div>
                        )
                    }

                    // Extract rag_config, llm_provider, client_system_prompt, and other properties
                    const { rag_config, llm_provider, client_system_prompt, ...otherProps } = props
                    const hasOtherProps = Object.keys(otherProps).length > 0

                    return (
                        <Collapsible open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="p-0 h-auto font-semibold text-lg mb-3">
                                    {isPropertiesOpen ? (
                                        <ChevronDown className="h-5 w-5 mr-2" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 mr-2" />
                                    )}
                                    Properties
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Setting</TableHead>
                                            <TableHead>Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {llm_provider && (
                                            <TableRow>
                                                <TableCell className="font-medium">LLM Provider</TableCell>
                                                <TableCell className="capitalize">{llm_provider}</TableCell>
                                            </TableRow>
                                        )}
                                        {client_system_prompt && (
                                            <TableRow>
                                                <TableCell className="font-medium">System Prompt</TableCell>
                                                <TableCell className="whitespace-pre-wrap">
                                                    {client_system_prompt}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {rag_config?.query_rewrite && (
                                            <TableRow>
                                                <TableCell className="font-medium">Query Rewrite</TableCell>
                                                <TableCell>
                                                    {rag_config.query_rewrite.enabled ? 'Enabled' : 'Disabled'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {rag_config?.reranking && (
                                            <>
                                                <TableRow>
                                                    <TableCell className="font-medium">Reranking</TableCell>
                                                    <TableCell>
                                                        {rag_config.reranking.enabled ? 'Enabled' : 'Disabled'}
                                                    </TableCell>
                                                </TableRow>
                                                {rag_config.reranking.enabled && (
                                                    <TableRow>
                                                        <TableCell className="font-medium pl-8">
                                                            Reranking Top K
                                                        </TableCell>
                                                        <TableCell>{rag_config.reranking.top_k}</TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        )}
                                        {rag_config?.vector_search && (
                                            <>
                                                <TableRow>
                                                    <TableCell className="font-medium">Vector Search Top K</TableCell>
                                                    <TableCell>{rag_config.vector_search.top_k}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-medium">Similarity Threshold</TableCell>
                                                    <TableCell>
                                                        {rag_config.vector_search.similarity_threshold}
                                                    </TableCell>
                                                </TableRow>
                                            </>
                                        )}
                                        {rag_config?.references && (
                                            <TableRow>
                                                <TableCell className="font-medium">Source References</TableCell>
                                                <TableCell>
                                                    {rag_config.references.enabled ? 'Enabled' : 'Disabled'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {hasOtherProps &&
                                            Object.entries(otherProps).map(([key, value]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium">{key}</TableCell>
                                                    <TableCell>
                                                        {typeof value === 'object'
                                                            ? JSON.stringify(value, null, 2)
                                                            : String(value)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })()}

                {results.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Results</h3>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Question</TableHead>
                                        <TableHead className="w-[200px]">Answer</TableHead>
                                        <TableHead className="w-[200px]">Expected Answer</TableHead>
                                        <TableHead className="w-[100px]">LLM Rating</TableHead>
                                        <TableHead className="w-[100px]">Total Time (ms)</TableHead>
                                        <TableHead className="w-[100px]">TTFT (ms)</TableHead>
                                        <TableHead className="w-[150px]">Run Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((result) => (
                                        <TableRow
                                            key={result.uuid}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleResultClick(result)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="max-w-[250px] truncate" title={result.question}>
                                                    {result.question}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[250px] truncate" title={result.answer}>
                                                    {result.answer}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate" title={result.expected_answer}>
                                                    {result.expected_answer}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {result.llm_answer_rating !== null &&
                                                result.llm_answer_rating !== undefined
                                                    ? `${result.llm_answer_rating.toFixed(1)} / 10`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {result.total_answer_time_ms
                                                    ? result.total_answer_time_ms.toLocaleString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {result.time_to_first_token_ms
                                                    ? result.time_to_first_token_ms.toLocaleString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>{new Date(result.created_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Run Experiment</DialogTitle>
                        <DialogDescription>
                            Running this experiment will use{' '}
                            <b>
                                {questions.length} write{questions.length !== 1 ? 's' : ''}
                            </b>
                            . Proceed?
                            <br />
                            <br />
                            <b>
                                <InfoIcon className="h-4 w-4 inline" /> Note:
                            </b>{' '}
                            Do not close the browser window or leave this page while the experiment is running.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmRun}>Proceed</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ExperimentResultModal result={selectedResult} open={isModalOpen} onOpenChange={setIsModalOpen} />
        </div>
    )
}
