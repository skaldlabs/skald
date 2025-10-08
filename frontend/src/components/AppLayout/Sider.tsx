import { Layout, Menu } from 'antd'
import { DashboardOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider: AntSider } = Layout

const menuItems = [
    {
        key: '/',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
    },
    {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Profile',
    },
    {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
    },
]

export const Sider = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(key)
    }

    return (
        <AntSider theme="light" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', background: 'var(--bg-layout)' }}>
            <div style={{ height: 32, margin: 16, background: 'rgba(0,0,0,0.2)' }} />
            <Menu
                style={{ background: 'linear-gradient(to top, hsl(220, 13%, 95%) 0%, hsla(220, 13%, 95%, 0) 50%)' }}
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
            />
        </AntSider>
    )
}
