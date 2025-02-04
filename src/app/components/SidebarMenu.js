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
        key: '1',
        label: 'Quản lý đơn hàng',
        href: '/orders',
      },
      {
        key: '2',
        label: 'Chưa hoàn tất',
        href: '/orders',
      },
      {
        key: '3',
        label: 'Giao hàng hàng loạt',
        href: '/orders',
        children: [
          {
            key: '4-1',
            label: 'Đã giao hàng',
            href: '/orders',
          },
          {
            key: '4-2',
            label: 'Chưa giao hàng',
            href: '/orders',
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
        href: '/shipping-summary',
      },
      {
        key: '6',
        label: 'Vận chuyển',
        href: '/shipping-orders',
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
        href: '/products',
      },
      {
        key: '10',
        label: 'Tồn Kho',
        href: '/stock',
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