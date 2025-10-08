import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import { useNavigate, Link } from 'react-router-dom'

export const LoginPage = () => {
    const [loading, setLoading] = useState(false)
    const login = useAuthStore((state) => state.login)
    const navigate = useNavigate()

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true)
        try {
            const success = await login(values.username, values.password)
            if (success) {
                message.success('Login successful!')
                navigate('/')
            } else {
                message.error('Invalid credentials')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#f0f2f5',
            }}
        >
            <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Welcome Back</h1>
                <Form name="login" onFinish={onFinish} size="large">
                    <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Username" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                            Log in
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </div>
                </Form>
            </Card>
        </div>
    )
}
