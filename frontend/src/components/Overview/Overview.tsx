import { useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useOverviewStore } from '@/stores/overviewStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { FileText, MessageSquare, Key, BookOpen, ExternalLink } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export const Overview = () => {
    const currentProject = useProjectStore((state) => state.currentProject)
    const navigate = useNavigate()
    const { stats, loading, fetchStats } = useOverviewStore()

    useEffect(() => {
        fetchStats()
    }, [currentProject, fetchStats])

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No project selected</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl space-y-6 md:space-y-8">
            <div>
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{currentProject.name}</h1>
                </div>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">Project overview</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Memos</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.memoCount ?? 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Total memos ingested</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chats</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.chatCount ?? 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Total chat sessions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Key</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {currentProject.has_api_key ? (
                                <span className="text-green-600 dark:text-green-400">Active</span>
                            ) : (
                                <span className="text-amber-600 dark:text-amber-400">Not set</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {currentProject.has_api_key ? (
                                `Starts with ${currentProject.api_key_first_12_digits}...`
                            ) : (
                                <>
                                    Generate one in{' '}
                                    <Link
                                        to={`/projects/${currentProject.uuid}/settings`}
                                        className="text-primary underline hover:no-underline"
                                    >
                                        Settings
                                    </Link>
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="w-full sm:w-auto" onClick={() => navigate(`/projects/${currentProject.uuid}/memos`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Memos
                </Button>
                <Button
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={() => navigate(`/projects/${currentProject.uuid}/settings`)}
                >
                    <Key className="mr-2 h-4 w-4" />
                    Manage API Key
                </Button>
                <Button
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={() => window.open('https://docs.useskald.com', '_blank', 'noopener,noreferrer')}
                >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Documentation
                    <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}
