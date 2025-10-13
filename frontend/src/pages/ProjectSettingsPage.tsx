import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { useProjectStore } from '@/stores/projectStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, RefreshCw, Key, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const ProjectSettingsPage = () => {
    const { uuid } = useParams<{ uuid: string }>()
    const navigate = useNavigate()
    const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    const projects = useProjectStore((state) => state.projects)
    const currentProject = useProjectStore((state) => state.currentProject)
    const generateApiKey = useProjectStore((state) => state.generateApiKey)
    const fetchProjects = useProjectStore((state) => state.fetchProjects)

    // Find the project by UUID from URL params
    const project = uuid ? projects.find((p) => p.uuid === uuid) : currentProject

    useEffect(() => {
        if (projects.length === 0) {
            fetchProjects()
        }
    }, [projects.length, fetchProjects])

    // Redirect if no project found
    useEffect(() => {
        if (projects.length > 0 && !project) {
            navigate('/projects')
        }
    }, [project, projects.length, navigate])

    const handleGenerateApiKey = async () => {
        if (!project) return

        setIsGenerating(true)
        const apiKey = await generateApiKey(project.uuid)
        setIsGenerating(false)

        if (apiKey) {
            setGeneratedApiKey(apiKey)
        }
    }

    const handleCopyApiKey = (key: string) => {
        navigator.clipboard.writeText(key)
        setCopied(true)
        console.log('copied', copied)
        toast.success('API key copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    const getMaskedApiKey = () => {
        if (!project?.api_key_first_12_digits) return ''
        return `${project.api_key_first_12_digits}${'*'.repeat(28)}`
    }

    const handleConfirmCopied = () => {
        setGeneratedApiKey(null)
    }

    if (!project) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="p-6 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold mb-2">Project Settings</h1>
                    <p className="text-muted-foreground">{project.name}</p>
                </div>

                {/* API Key Card */}
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
                                    <div className="flex items-start gap-2">
                                        <span className="text-yellow-600 dark:text-yellow-500 text-xl">⚠️</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                                                This API key will only be shown once. Make sure to copy and store it
                                                securely.
                                            </p>
                                        </div>
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
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" onClick={handleConfirmCopied}>
                                            I've copied the API key
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : project.has_api_key ? (
                            // Show masked API key if it exists
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input value={getMaskedApiKey()} readOnly className="font-mono text-sm" />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopyApiKey(getMaskedApiKey())}
                                        title="Copy masked key"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={handleGenerateApiKey} disabled={isGenerating} variant="outline">
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
            </div>
        </AppLayout>
    )
}
