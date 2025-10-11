import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, Users, CheckCircle } from 'lucide-react'

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

export const Dashboard = () => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatisticCard title="Active Projects" value={8} icon={<LayoutDashboard className="h-8 w-8" />} />
                <StatisticCard
                    title="Tasks Completed"
                    value={24}
                    suffix="/ 50"
                    icon={<CheckCircle className="h-8 w-8" />}
                />
                <StatisticCard title="Team Members" value={12} icon={<Users className="h-8 w-8" />} />
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
