import { Sider } from '@/components/AppLayout/Sider/Sider'
import { SidebarProvider } from '@/components/ui/sidebar'
// import { useEffect } from 'react'
// import { useSubscriptionStore } from '@/stores/subscriptionStore'

import './AppLayout.scss'
import { useEffect } from 'react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription)

    useEffect(() => {
        fetchSubscription()
    }, [fetchSubscription])

    return (
        <div className="app-layout">
            <SidebarProvider>
                <Sider />
                <main className="app-layout-content">{children}</main>
            </SidebarProvider>
        </div>
    )
}
