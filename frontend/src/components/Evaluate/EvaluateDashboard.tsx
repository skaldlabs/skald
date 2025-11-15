import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { ExperimentsTab } from './ExperimentsTab'
import { DatasetsTab } from './DatasetsTab'

export const EvaluateDashboard = () => {

    return (
        <div className="evaluate-dashboard">
            <PageHeader title="Evaluate (Alpha)" />
            <p className="text-muted-foreground mb-4">Our evaluations feature is still in Alpha. This means it has limited functionality and rough edges.</p>
            <p className="text-muted-foreground mb-4">If you're interested in helping us improve this feature, let us know on <a href="https://github.com/skaldlabs/skald" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>.</p>
            <hr className="my-4" />
            <Tabs defaultValue="experiments" className="w-full">
                <TabsList>
                    <TabsTrigger value="experiments">Experiments</TabsTrigger>
                    <TabsTrigger value="datasets">Datasets</TabsTrigger>
                </TabsList>

                <TabsContent value="experiments">
                    <ExperimentsTab />
                </TabsContent>

                <TabsContent value="datasets">
                    <DatasetsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
