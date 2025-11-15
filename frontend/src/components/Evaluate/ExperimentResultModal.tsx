import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ExperimentResult } from '@/stores/evaluateExperimentsStore'

interface ExperimentResultModalProps {
    result: ExperimentResult | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const ExperimentResultModal = ({ result, open, onOpenChange }: ExperimentResultModalProps) => {
    if (!result) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Experiment Result</DialogTitle>
                    <DialogDescription>Run on {new Date(result.created_at).toLocaleString()}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                        <h3 className="text-sm font-bold mb-1">LLM Rating</h3>
                        <p className="text-sm">
                            {result.llm_answer_rating !== null && result.llm_answer_rating !== undefined
                                ? `${result.llm_answer_rating.toFixed(1)} / 10`
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold mb-1">Human Rating</h3>
                        <p className="text-sm">
                            {result.human_answer_rating !== null && result.human_answer_rating !== undefined
                                ? `${result.human_answer_rating.toFixed(1)} / 10`
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold mb-1">Total Time</h3>
                        <p className="text-sm">
                            {result.total_answer_time_ms
                                ? `${Math.round(result.total_answer_time_ms).toLocaleString()} ms`
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold mb-1">Time to First Token</h3>
                        <p className="text-sm">
                            {result.time_to_first_token_ms
                                ? `${Math.round(result.time_to_first_token_ms).toLocaleString()} ms`
                                : '-'}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold mb-2">Question</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none react-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.question}</ReactMarkdown>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Generated Answer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none react-markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Expected Answer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none react-markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.expected_answer}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
