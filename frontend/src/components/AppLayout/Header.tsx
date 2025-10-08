import { Layout } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'

const { Header: AntHeader } = Layout

export const Header = () => {
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    return (
        <AntHeader
            style={{ background: 'var(--bg-layout)', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'flex-end',
                }}
            >
                <span style={{ color: 'var(--fg-card)' }}>{user?.username}</span>
                <button
                    onClick={logout}
                    style={{
                        border: 'none',
                        background: 'inherit',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <LogoutOutlined style={{ color: '#ff4d4f' }} />
                </button>
            </div>
        </AntHeader>
    )
}
