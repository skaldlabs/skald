import { Sider } from '@/components/AppLayout/Sider/Sider'
import { SidebarProvider } from '@/components/ui/sidebar'
// import { useEffect } from 'react'
// import { useSubscriptionStore } from '@/stores/subscriptionStore'

import './AppLayout.scss'

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    // const fetchSubscriptionStatus = useSubscriptionStore((state) => state.fetchSubscriptionStatus)

    // useEffect(() => {
    //     fetchSubscriptionStatus()
    // }, [fetchSubscriptionStatus])

    return (
        <div className="app-layout">
            <SidebarProvider>
                <Sider />
                <main className="app-layout-content">{children}</main>
            </SidebarProvider>
        </div>
    )
}
