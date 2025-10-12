import { AppLayout } from './AppLayout'
import './Page.scss'

export const Page = ({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) => {
    return (
        <AppLayout>
            <div className="page">
                <div className="page-header">
                    <h1>{pageTitle}</h1>
                    <hr />
                </div>
                <div className="page-content">{children}</div>
            </div>
        </AppLayout>
    )
}
