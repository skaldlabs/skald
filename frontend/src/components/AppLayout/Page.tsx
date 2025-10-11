import { AppLayout } from './AppLayout'
import styles from './Page.module.css'

export const Page = ({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) => {
    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>{pageTitle}</h1>
                    <hr />
                </div>
                <div className={styles.content}>{children}</div>
            </div>
        </AppLayout>
    )
}
