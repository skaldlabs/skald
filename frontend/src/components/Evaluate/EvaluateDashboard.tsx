import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { ExperimentsTab } from './ExperimentsTab'
import { DatasetsTab } from './DatasetsTab'

export const EvaluateDashboard = () => {
    return (
        <div className="evaluate-dashboard">
            <PageHeader title="Evaluate" />

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
