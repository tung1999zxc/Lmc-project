"use client";
import { Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  PieChartOutlined,
  CalendarOutlined ,
  MoneyCollectOutlined,
  ShopOutlined,
  FileTextOutlined,
  UserOutlined,
  BellOutlined ,
  HistoryOutlined, 
} from '@ant-design/icons';
import Link from 'next/link';

const { SubMenu } = Menu;

const menuItems = [
  {
    key: 'sub0',
    label: 'Tổng Quan',
    icon: <DashboardOutlined />,
    href: '/',
  },
  {
    key: 'sub1',
    label: 'Quản lý đơn hàng',
    icon: <ShoppingCartOutlined />,
    href: '/orders',
  },
  {
    key: 'sub2',
    label: 'Báo cáo MKT',
    icon: <PieChartOutlined />,
    href: '/mkt',
  },
  {
    key: 'sub3',
    label: 'Báo cáo Sale',
    icon: <MoneyCollectOutlined />,
    children: [
      {
        key: '99',
        label: 'Sale CHAT',
        href: '/sale/saleOrder',
      },
      {
        key: '699',
        label: 'Sale DONE',
        href: '/sale/saleConfirm',
      },
      {
        key: '799',
        label: 'Sale VẬN ĐƠN',
        href: '/sale/saleProcessing',
      },
    ],
  },
  {
    key: 'sub4',
    label: 'Tất cả sản Phẩm',
    icon: <ShopOutlined />,
    href: '/products',
  },
  {
    key: 'sub7',
    label: 'Tên page',
    icon: <FileTextOutlined />,
    href: '/pagesName',
  },
  {
    key: 'sub5',
    label: 'Quản lý tài khoản',
    icon: <UserOutlined />,
    href: '/accounts',
  },
  {
    key: 'sub6',
    label: 'Lịch sử chỉnh sửa đơn hàng',
    icon: <HistoryOutlined />,
    href: '/OrderHistory',
  },
  {
    key: 'sub8',
    label: 'Chấm công SALE',
    icon: <CalendarOutlined />,
    href: '/attendance',
  },
  {
    key: 'sub9',
    label: 'Quản lý thông báo',
    icon: <BellOutlined />,
    href: '/NotificationManagement',
  },
];

const SidebarMenu = () => {
  return (
    <Menu theme="dark" mode="inline">
      {menuItems.map((menuItem) => {
        if (menuItem.children) {
          return (
            <SubMenu key={menuItem.key} title={menuItem.label} icon={menuItem.icon}>
              {menuItem.children.map((child) => (
                <Menu.Item key={child.key}>
                  <Link href={child.href}>{child.label}</Link>
                </Menu.Item>
              ))}
            </SubMenu>
          );
        } else {
          return (
            <Menu.Item key={menuItem.key} icon={menuItem.icon}>
              <Link href={menuItem.href}>{menuItem.label}</Link>
            </Menu.Item>
          );
        }
      })}
    </Menu>
  );
};

export default SidebarMenu;
