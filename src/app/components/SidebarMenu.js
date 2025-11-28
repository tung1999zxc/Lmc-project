"use client";

import { Menu } from "antd";
import { useSelector } from "react-redux";
import {
  ShoppingCartOutlined,
  MoneyCollectOutlined,
  ShopOutlined,
  FileTextOutlined,
  UserOutlined,
  BellOutlined,
  CalendarOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { SubMenu } = Menu;

const SidebarMenu = () => {
  // ❗ Hook phải đặt trong component
  const currentUser = useSelector((state) => state.user.currentUser);

  const isAdmin =
    currentUser?.position === "admin" ||
    currentUser?.name === "Trần Mỹ Hạnh";

  const isJP =
    currentUser?.name === "Nguyễn Quốc Hiếu"||currentUser?.name === "Hà Minh Sang"||currentUser?.name === "Nguyễn Thị Hồng Nhungg"||currentUser?.name === "KHO";
  const isTW =
    currentUser?.name === "Trần Ngọc Diện";

  // -------------------------
  // MENU CHO ADMIN
  // -------------------------
  const menuItems = [
    {
      key: "sub0",
      label: (
        <span>
          <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Hàn
        </span>
      ),
      href: "/",
    },
    {
      key: "sub01",
      label: (
        <span>
          <img src="/jp.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Nhật
        </span>
      ),
      href: "/overviewjp",
    },
    {
      key: "sub02",
      label: (
        <span>
          <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Đài
        </span>
      ),
      href: "/overviewtw",
    },

    {
      key: "sub11",
      label: (
        <span>
          <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Hàn
        </span>
      ),
      href: "/orders",
    },

    {
      key: "sub12",
      label: (
        <span>
          <img src="/jp.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Nhật
        </span>
      ),
      href: "/ordersjp",
    },

    {
      key: "sub13",
      label: (
        <span>
          <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Đài
        </span>
      ),
      href: "/orderstw",
    },

    {
      key: "sub211",
      label: "Báo cáo MKT",
      icon: <MoneyCollectOutlined />,
      children: [
        {
          key: "sub2",
          label: (
            <span>
              <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> MKT Hàn
            </span>
          ),
          href: "/mkt",
        },
        {
          key: "sub21",
          label: (
            <span>
              <img src="/jp.png" style={{ width: 18, marginRight: 6 }} /> MKT Nhật
            </span>
          ),
          href: "/mktjp",
        },
        {
          key: "sub22",
          label: (
            <span>
              <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> MKT Đài
            </span>
          ),
          href: "/mkttw",
        },
      ],
    },

    {
      key: "sub3",
      label: "Báo cáo Sale",
      icon: <MoneyCollectOutlined />,
      children: [
        { key: "99", label: "Sale CHAT", href: "/sale/saleOrder" },
        { key: "699", label: "Sale DONE", href: "/sale/saleConfirm" },
        { key: "799", label: "Sale VẬN ĐƠN", href: "/sale/saleProcessing" },
      ],
    },

    {
      key: "products",
      label: "Sản Phẩm",
      icon: <ShopOutlined />,
      children: [
        { key: "sub4", label: "HÀN QUỐC", href: "/products" },
        { key: "sub41", label: "NHẬT BẢN", href: "/productsjp" },
        { key: "sub42", label: "ĐÀI LOAN", href: "/productstw" },
      ],
    },

    { key: "sub7", label: "Tên page", icon: <FileTextOutlined />, href: "/pagesName" },
    { key: "sub5", label: "Quản lý tài khoản", icon: <UserOutlined />, href: "/accounts" },
    { key: "sub8", label: "Chấm công SALE", icon: <CalendarOutlined />, href: "/attendance" },
    { key: "sub9", label: "Quản lý thông báo", icon: <BellOutlined />, href: "/NotificationManagement" },
  ];
  const menuItemstw = [
    {
      key: "sub0",
      label: (
        <span>
          <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Hàn
        </span>
      ),
      href: "/",
    },
    
    {
      key: "sub02",
      label: (
        <span>
          <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Đài
        </span>
      ),
      href: "/overviewtw",
    },

    {
      key: "sub11",
      label: (
        <span>
          <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Hàn
        </span>
      ),
      href: "/orders",
    },

   

    {
      key: "sub13",
      label: (
        <span>
          <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Đài
        </span>
      ),
      href: "/orderstw",
    },

    {
      key: "sub211",
      label: "Báo cáo MKT",
      icon: <MoneyCollectOutlined />,
      children: [
        {
          key: "sub2",
          label: (
            <span>
              <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> MKT Hàn
            </span>
          ),
          href: "/mkt",
        },
       
        {
          key: "sub22",
          label: (
            <span>
              <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> MKT Đài
            </span>
          ),
          href: "/mkttw",
        },
      ],
    },

    {
      key: "sub3",
      label: "Báo cáo Sale",
      icon: <MoneyCollectOutlined />,
      children: [
        { key: "99", label: "Sale CHAT", href: "/sale/saleOrder" },
        { key: "699", label: "Sale DONE", href: "/sale/saleConfirm" },
        { key: "799", label: "Sale VẬN ĐƠN", href: "/sale/saleProcessing" },
      ],
    },

    {
      key: "products",
      label: "Sản Phẩm",
      icon: <ShopOutlined />,
      children: [
        { key: "sub4", label: "HÀN QUỐC", href: "/products" },
       
        { key: "sub42", label: "ĐÀI LOAN", href: "/productstw" },
      ],
    },

    { key: "sub7", label: "Tên page", icon: <FileTextOutlined />, href: "/pagesName" },
    { key: "sub5", label: "Quản lý tài khoản", icon: <UserOutlined />, href: "/accounts" },
   
    { key: "sub9", label: "Quản lý thông báo", icon: <BellOutlined />, href: "/NotificationManagement" },
  ];
  // -------------------------
  const menuItems3 = [
    
    {
      key: "sub01",
      label: (
        <span>
          <img src="/jp.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Nhật
        </span>
      ),
      href: "/overviewjp",
    },
    {
      key: "sub02",
      label: (
        <span>
          <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Đài
        </span>
      ),
      href: "/overviewtw",
    },

   

    {
      key: "sub12",
      label: (
        <span>
          <img src="/jp.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Nhật
        </span>
      ),
      href: "/ordersjp",
    },

    {
      key: "sub13",
      label: (
        <span>
          <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> Quản lý đơn
          hàng Đài
        </span>
      ),
      href: "/orderstw",
    },

    {
      key: "sub211",
      label: "Báo cáo MKT",
      icon: <MoneyCollectOutlined />,
      children: [
        
        {
          key: "sub21",
          label: (
            <span>
              <img src="/jp.png" style={{ width: 18, marginRight: 6 }} /> MKT Nhật
            </span>
          ),
          href: "/mktjp",
        },
        {
          key: "sub22",
          label: (
            <span>
              <img src="/tw.png" style={{ width: 18, marginRight: 6 }} /> MKT Đài
            </span>
          ),
          href: "/mkttw",
        },
      ],
    },

    

    {
      key: "products",
      label: "Sản Phẩm",
      icon: <ShopOutlined />,
      children: [
       
        { key: "sub41", label: "NHẬT BẢN", href: "/productsjp" },
        { key: "sub42", label: "ĐÀI LOAN", href: "/productstw" },
      ],
    },

    { key: "sub7", label: "Tên page", icon: <FileTextOutlined />, href: "/pagesName" },
    { key: "sub5", label: "Quản lý tài khoản", icon: <UserOutlined />, href: "/accounts" },
   
    { key: "sub9", label: "Quản lý thông báo", icon: <BellOutlined />, href: "/NotificationManagement" },
  ];

  // -------------------------
  // MENU NHÂN VIÊN
  // -------------------------
  const menuItems2 = [
    {
      key: "sub0",
      label: (
        <span>
          <img src="/kr.png" style={{ width: 18, marginRight: 6 }} /> Tổng Quan
          Hàn
        </span>
      ),
      href: "/",
    },

    {
      key: "sub1",
      label: "Quản lý đơn hàng",
      icon: <ShoppingCartOutlined />,
      href: "/orders",
    },

    {
      key: "sub2",
        icon: <MoneyCollectOutlined />,
      label: (
        <span>
          Báo cáo MKT
          Hàn
        </span>
      ),
      href: "/mkt",
    },

    {
      key: "sub3",
      label: "Báo cáo Sale",
      icon: <MoneyCollectOutlined />,
      children: [
        { key: "99", label: "Sale CHAT", href: "/sale/saleOrder" },
        { key: "699", label: "Sale DONE", href: "/sale/saleConfirm" },
        { key: "799", label: "Sale VẬN ĐƠN", href: "/sale/saleProcessing" },
      ],
    },

    {
      key: "sub4",
      label: "Tất cả sản Phẩm",
      icon: <ShopOutlined />,
      href: "/products",
    },

    { key: "sub7", label: "Tên page", icon: <FileTextOutlined />, href: "/pagesName" },
    { key: "sub5", label: "Quản lý tài khoản", icon: <UserOutlined />, href: "/accounts" },
    { key: "sub6", label: "Lịch sử chỉnh sửa đơn hàng", icon: <HistoryOutlined />, href: "/OrderHistory" },
    { key: "sub8", label: "Chấm công SALE", icon: <CalendarOutlined />, href: "/attendance" },
    { key: "sub9", label: "Quản lý thông báo", icon: <BellOutlined />, href: "/NotificationManagement" },
  ];

 const menuToUse = isAdmin
  ? menuItems
  : isJP
    ? menuItems3: isTW
    ? menuItemstw
    : menuItems2;
 
  // -------------------------
  // RENDER MENU
  // -------------------------
  return (
    <Menu theme="dark" mode="inline">
      {menuToUse.map((item) =>
        item.children ? (
          <SubMenu key={item.key} title={item.label} icon={item.icon}>
            {item.children.map((child) => (
              <Menu.Item key={child.key}>
                <Link href={child.href}>{child.label}</Link>
              </Menu.Item>
            ))}
          </SubMenu>
        ) : (
          <Menu.Item key={item.key} icon={item.icon}>
            <Link href={item.href}>{item.label}</Link>
          </Menu.Item>
        )
      )}
    </Menu>
  );
};

export default SidebarMenu;
