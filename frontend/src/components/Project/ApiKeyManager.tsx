import { useState } from 'react'
import { Copy, RefreshCw, Key, Loader2, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface ApiKeyManagerProps {
    project: Project
}

export const ApiKeyManager = ({ project }: ApiKeyManagerProps) => {
    const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [updatedProject, setUpdatedProject] = useState<Project>(project)
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)

    const generateApiKey = useProjectStore((state) => state.generateApiKey)
    const fetchProjects = useProjectStore((state) => state.fetchProjects)
    const projects = useProjectStore((state) => state.projects)

    const handleGenerateApiKey = async () => {
        setIsGenerating(true)
        setShowRegenerateDialog(false)
        const apiKey = await generateApiKey(updatedProject.uuid)
        setIsGenerating(false)

        if (apiKey) {
            setGeneratedApiKey(apiKey)
        }
    }

    const handleRegenerateClick = () => {
        setShowRegenerateDialog(true)
    }

    const handleCopyApiKey = (key: string) => {
        navigator.clipboard.writeText(key)
        setCopied(true)
        toast.success('API key copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    const getMaskedApiKey = () => {
        if (!updatedProject?.api_key_first_12_digits) return ''
        return `${updatedProject.api_key_first_12_digits}${'*'.repeat(28)}`
    }

    const handleConfirmCopied = async () => {
        await fetchProjects()
        const updated_project = projects.find((p) => p.uuid === project.uuid)
        if (updated_project) {
            setUpdatedProject(updated_project)
        }
        setGeneratedApiKey(null)
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        <CardTitle>API Key</CardTitle>
                    </div>
                    <CardDescription>
                        Use this API key to authenticate requests to the Skald API for this project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {generatedApiKey ? (
                        // Show the newly generated API key
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-600 dark:text-yellow-500 text-xl">⚠️</span>
                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                                        This API key will only be shown once. Make sure to copy and store it securely.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input value={generatedApiKey} readOnly className="font-mono text-sm" />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopyApiKey(generatedApiKey)}
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="outline" onClick={handleConfirmCopied}>
                                        I've copied the API key
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : updatedProject.has_api_key ? (
                        // Show masked API key if it exists
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input value={getMaskedApiKey()} readOnly className="font-mono text-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handleRegenerateClick} disabled={isGenerating} variant="outline">
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Regenerate API Key
                                        </>
                                    )}
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    This will invalidate the current API key
                                </p>
                            </div>
                        </div>
                    ) : (
                        // No API key exists yet
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                No API key has been generated for this project yet.
                            </p>
                            <Button onClick={handleGenerateApiKey} disabled={isGenerating}>
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Key className="h-4 w-4 mr-2" />
                                        Generate API Key
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Regenerate API Key?
                        </DialogTitle>
                        <DialogDescription>
                            This will generate a new API key and invalidate your existing key. Any applications using
                            the old key will stop working immediately.
                            <br />
                            <br />
                            Are you sure you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleGenerateApiKey} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Yes, Regenerate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
