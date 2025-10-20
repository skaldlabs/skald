import { SidebarTrigger } from '@/components/ui/sidebar'

interface PageHeaderProps {
    title: string
    children?: React.ReactNode
}

export const PageHeader = ({ title, children }: PageHeaderProps) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-3xl font-bold">{title}</h1>
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    )
}
