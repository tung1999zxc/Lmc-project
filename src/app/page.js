"use client";
import { Layout,Dropdown,Space, Menu, Input, Card, Row, Col, Statistic, Table, Button } from 'antd';
import { DashboardOutlined, ShoppingCartOutlined,DownOutlined , AppstoreOutlined, UserOutlined, FundOutlined, GiftOutlined} from '@ant-design/icons';
import { useState } from 'react';
import  RevenueDashboard  from './components/RevenueDashboard';
import Link from 'next/link';

const { SubMenu } = Menu;
const { Header, Sider, Content } = Layout;
const { Search } = Input;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);

  const item = [
    {
      key: 'sub0',
      label: 'Tổng Quan',
      icon: <DashboardOutlined />,
      href: '/',},
    {
      key: 'sub1',
      label: 'Tất cả đơn hàng',
      icon: <ShoppingCartOutlined />,
      href: '/draft-orders',
      children: [
        {
          key: '1',
          label: 'Đơn hàng nháp',
           href: '/draft-orders',
        },
        {
          key: '2',
          label: 'Chưa hoàn tất',
          href: '/pending-orders',
        },
        {
          key: '3',
          label: 'Giao hàng hàng loạt',
          href: '/bulk-delivery', // Đường dẫn trang cho "Giao hàng hàng loạt"
             children: [
      {
        key: '4-1',
        label: 'Đã giao hàng',
        href: '/delivered-orders', // Đường dẫn trang cho "Đã giao hàng"
      },
      {
        key: '4-2',
        label: 'Chưa giao hàng',
        href: '/undelivered-orders', // Đường dẫn trang cho "Chưa giao hàng"
      },
    ],
        },
        
      ],
    },
    {
      key: 'sub2',
      label: 'Vận chuyển',
      icon: <AppstoreOutlined />,
      children: [
        {
          key: '5',
          label: 'Tổng quan',
          href: '/shipping-summary', // Đư��ng d��n trang cho "T��ng quan vận chuyển"
        },
        {
          key: '6',
          label: 'Vận chuyển',
          href: '/shipping-orders', // Đư��ng d��n trang cho "Vận chuyển"
        },
        {
          key: '7',
          label: 'Option 7',
          href: '/undelivered-orders',
        },
        {
          key: '8',
          label: 'Option 8',
          href: '/undelivered-orders',
        },
      ],
    },
    {
      key: 'sub4',
      label: 'Sản phẩm',
      icon: <AppstoreOutlined />,
      children: [
        {
          key: '9',
          label: 'Tất cả sản Phẩm',
          href: '/products', // Đư��ng d��n trang cho "Tất cả sản phẩm"
        },
        {
          key: '10',
          label: 'Tồn Kho',
          href: '/stock', // Đư��ng d��n trang cho "Tồn Kho"
        },
        { 
          key: '11',
          label: 'Option 11',
          href: '/undelivered-orders',
        },
        {
          key: '12',
          label: 'Option 12',
          href: '/undelivered-orders',
        },
      ],
    },
  ];

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
