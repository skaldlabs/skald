import { Layout } from 'antd'
import { Header } from '@/components/AppLayout/Header'
import { Sider } from '@/components/AppLayout/Sider'

const { Content } = Layout

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider />
            <Layout>
                <Header />
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>{children}</Content>
            </Layout>
        </Layout>
    )
}
