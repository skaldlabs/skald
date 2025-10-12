import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, Users, CheckCircle } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

interface StatisticCardProps {
    title: string
    value: number
    icon?: React.ReactNode
    suffix?: string
}

const StatisticCard = ({ title, value, icon, suffix }: StatisticCardProps) => {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold mt-2">
                            {value}
                            {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
                        </p>
                    </div>
                    {icon && <div className="text-muted-foreground">{icon}</div>}
                </div>
            </CardContent>
        </Card>
    )
}

// Generate consistent "random" values based on project UUID
const getProjectStats = (projectUuid: string | undefined) => {
    if (!projectUuid) {
        return { activeProjects: 0, tasksCompleted: 0, totalTasks: 0, teamMembers: 0 }
    }

    // Simple hash function to generate consistent values from UUID
    const hash = projectUuid.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)

    // Generate values based on hash
    const activeProjects = Math.abs(hash % 15) + 1 // 1-15
    const totalTasks = Math.abs((hash * 7) % 80) + 20 // 20-99
    const tasksCompleted = Math.abs((hash * 3) % totalTasks) // 0-totalTasks
    const teamMembers = Math.abs((hash * 11) % 20) + 3 // 3-22

    return { activeProjects, tasksCompleted, totalTasks, teamMembers }
}

export const Dashboard = () => {
    const currentProject = useProjectStore((state) => state.currentProject)
    const stats = getProjectStats(currentProject?.uuid)

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatisticCard
                    title="Active Projects"
                    value={stats.activeProjects}
                    icon={<LayoutDashboard className="h-8 w-8" />}
                />
                <StatisticCard
                    title="Tasks Completed"
                    value={stats.tasksCompleted}
                    suffix={`/ ${stats.totalTasks}`}
                    icon={<CheckCircle className="h-8 w-8" />}
                />
                <StatisticCard title="Team Members" value={stats.teamMembers} icon={<Users className="h-8 w-8" />} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No recent activity to display.</p>
                </CardContent>
            </Card>
        </div>
    )
}
