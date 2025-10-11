import { Sider } from '@/components/AppLayout/Sider/Sider'
import { SidebarProvider } from '@/components/ui/sidebar'
// import { useEffect } from 'react'
// import { useSubscriptionStore } from '@/stores/subscriptionStore'

import styles from './AppLayout.module.css'

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    // const fetchSubscriptionStatus = useSubscriptionStore((state) => state.fetchSubscriptionStatus)

    // useEffect(() => {
    //     fetchSubscriptionStatus()
    // }, [fetchSubscriptionStatus])

    return (
        <div>
            <SidebarProvider>
                <Sider />
                <main className={styles.content}>{children}</main>
            </SidebarProvider>
        </div>
    )
}
