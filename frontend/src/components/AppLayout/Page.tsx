import { AppLayout } from './AppLayout'
import { SidebarTrigger } from '@/components/ui/sidebar'
import './Page.scss'

export const Page = ({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) => {
    return (
        <AppLayout>
            <div className="page">
                <div className="page-header">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <h1>{pageTitle}</h1>
                    </div>
                    <hr />
                </div>
                <div className="page-content">{children}</div>
            </div>
        </AppLayout>
    )
}
