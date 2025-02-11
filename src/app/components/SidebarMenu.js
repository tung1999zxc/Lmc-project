"use client";
import { Menu } from 'antd';
import { DashboardOutlined, ShoppingCartOutlined, AppstoreOutlined } from '@ant-design/icons';
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
    label: 'Tất cả đơn hàng',
    icon: <ShoppingCartOutlined />,
    href: '/orders',
    children: [
      {
        key: '199',
        label: 'Quản lý đơn hàng',
        href: '/orders',
      },
    ]
  },
  {
    key: 'sub2',
    label: 'Maketing',
    icon: <AppstoreOutlined />,
    children: [
      {
        key: '999',
        label: 'Báo cáo MKT',
        href: '/mkt',
      },
      
      
    ],
  },
  {
    key: 'sub3',
    label: 'Báo cáo Sale',
    icon: <AppstoreOutlined />,
    children: [
    
      {
        key: '99',
        label: 'Sale nhập đơn',
        href: '/sale/saleOrder',
      },
      {
        key: '699',
        label: 'Sale Xác nhận',
        href: '/sale/saleConfirm',
      },
      {
        key: '799',
        label: 'Sale xử lý',
        href: '/sale/saleProcessing',
      },
     
    ],
  },
  {
    key: 'sub4',
    label: 'Sản phẩm',
    icon: <AppstoreOutlined />,
    children: [
      {
        key: '9999',
        label: 'Tất cả sản Phẩm',
        href: '/orders',
      },
      {
        key: '109999',
        label: 'Tồn Kho',
        href: '/orders',
      },
      
    ],
  },
  {
    key: 'sub5',
    label: 'Quản lý tài khoản',
    icon: <AppstoreOutlined />,
    children: [
      {
        key: '30',
        label: 'Tổng quan',
        href: '/accounts',
      },
      
    ],
  },
];

const SidebarMenu = () => {
  return (
    <Menu theme="dark" mode="inline"  >
      {menuItems.map((menuItem) => {
        if (menuItem.children) {
          return (
            <SubMenu  key={menuItem.key} title={menuItem.label} icon={menuItem.icon}>
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