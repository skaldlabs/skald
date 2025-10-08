import { Card, Row, Col, Statistic } from 'antd'
import { DashboardOutlined, UserOutlined } from '@ant-design/icons'

export const Dashboard = () => {
    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Active Projects" value={8} prefix={<DashboardOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tasks Completed" value={24} suffix="/ 50" />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Team Members" value={12} prefix={<UserOutlined />} />
                    </Card>
                </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title="Recent Activity">
                        <p>No recent activity to display.</p>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
