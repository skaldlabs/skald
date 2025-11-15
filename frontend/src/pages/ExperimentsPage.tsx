import { AppLayout } from '@/components/AppLayout/AppLayout'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { ExperimentsTab } from '@/components/Evaluate/ExperimentsTab'

export const ExperimentsPage = () => {
    return (
        <AppLayout>
            <PageHeader title="Experiments" />
            <p className="text-muted-foreground mb-4 px-4">
                Our evaluations feature is still in Alpha. This means it has limited functionality and rough edges.
            </p>
            <p className="text-muted-foreground mb-4 px-4">
                If you're interested in helping us improve this feature, let us know on{' '}
                <a
                    href="https://github.com/skaldlabs/skald"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                >
                    GitHub
                </a>
                .
            </p>
            <hr className="mb-4" />
            <ExperimentsTab />
        </AppLayout>
    )
}
