import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link } from 'react-router-dom'

export const SignupPage = () => {
    const [loading, setLoading] = useState(false)
    const signup = useAuthStore((state) => state.signup)
    const navigate = useNavigate()

    const onFinish = async (values: { username: string; email: string; password: string; confirm: string }) => {
        if (values.password !== values.confirm) {
            message.error('Passwords do not match!')
            return
        }

        setLoading(true)
        try {
            const success = await signup(values.username, values.email, values.password)
            if (success) {
                message.success('Signup successful!')
                navigate('/')
            } else {
                message.error('Signup failed. Please try again.')
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
                <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Create Account</h1>
                <Form name="signup" onFinish={onFinish} size="large">
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: 'Please input your username!' },
                            { min: 3, message: 'Username must be at least 3 characters!' },
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Username" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Please input your password!' },
                            { min: 8, message: 'Password must be at least 8 characters!' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item name="confirm" rules={[{ required: true, message: 'Please confirm your password!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                            Sign up
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        Already have an account? <Link to="/login">Log in</Link>
                    </div>
                </Form>
            </Card>
        </div>
    )
}
