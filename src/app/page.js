"use client";
import { Layout, Card, Row, Col, Statistic, Table, Button } from 'antd';
import  RevenueDashboard  from './components/RevenueDashboard';
import Link from 'next/link';

// const { SubMenu } = Menu;
const { Content } = Layout;
// const { Search } = Input;

const Dashboard = () => {
  // const [collapsed, setCollapsed] = useState(false);

  

  const ordersData = [
    { key: '1', status: 'Chưa thanh toán', count: 0 },
    { key: '2', status: 'Chưa giao hàng', count: 35 },
    { key: '3', status: 'Đang giao hàng', count: 0 },
    { key: '4', status: 'Hủy đơn hàng', count: 0 },
  ];

  const columns = [
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Số lượng', dataIndex: 'count', key: 'count' },
  ];

  return (
    
      
        
        <Content style={{ }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Kết quả kinh doanh hôm nay">
                <Row gutter={16}>
                  <Col span={12}><Statistic title="Doanh thu" value={0} prefix="$" />
                  <Button> <Link href="/1"></Link>Xem báo cáo</Button></Col>
                  <Col span={12}><Statistic title="Đơn hàng" value={0} />
                  <Button>Xem báo cáo</Button>
                  </Col>
                </Row>
              </Card>
              <Card title="Trạng thái đơn hàng" style={{ marginTop: '16px' }}>
            <Table columns={columns} dataSource={ordersData} pagination={false} />
          </Card>
            </Col>
            <Col span={12}>
            <RevenueDashboard/>
            </Col>
          </Row>

        </Content>
   
  );
};

export default Dashboard;
