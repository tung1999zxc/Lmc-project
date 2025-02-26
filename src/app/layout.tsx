"use client";

import React, { useState } from "react";
import { Layout, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store/store";
import { setCurrentUser } from "./store/userSlice";

import SidebarMenu from "./components/SidebarMenu";
import CurrentUserSelector from "./components/CurrentUserSelector";

const { Header, Content, Sider } = Layout;

/**
 * Tách riêng "InnerDashboardLayout" - component thật sự dùng Redux
 * Để chắc chắn nó nằm trong Provider
 */
function InnerDashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch(); // Đã có Provider bao ngoài
  const router = useRouter();

  // Hàm logout
  const handleLogout = () => {
    dispatch(
      setCurrentUser({
        username: "",
        employee_code: 0,
        name: "",
        position: "",
        team_id: "",
        position_team: "",
      })
    );
    router.push("/login");
  };

  return (
    <>
      {/* Hình nền góc trên phải */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          right: "2%",
          width: "10%",
          height: "10%",
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.6,
          zIndex: 1,
        }}
      />

      <Layout
        style={{
          transform: "scale(0.85)",
          transformOrigin: "top left",
          width: "120%", // Để bù lại không gian khi scale
        }}
      >
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{ paddingLeft: "-20px" }}
        >
          <div
            className="logo"
            style={{
              color: "white",
              textAlign: "center",
              padding: "20px",
            }}
          />
          <SidebarMenu />
        </Sider>

        <Layout>
          <Header
            style={{
              background: "linear-gradient(90deg, #4b6cb7, #182848)",
              padding: "0 20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "64px",
            }}
          >
            {/* <CurrentUserSelector /> */}
<div></div>
            <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#fff" }}>
              <Button type="primary" icon={<LogoutOutlined />} danger onClick={handleLogout}>
                Đăng Xuất
              </Button>
            </div>
          </Header>

          <Content style={{ margin: "16px" }}>{children}</Content>
        </Layout>
      </Layout>
    </>
  );
}

/**
 * DashboardLayout: Bọc <Provider> ngoài InnerDashboardLayout
 * để InnerDashboardLayout có thể dùng useDispatch, useSelector
 */
export default function DashboardLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Đặt Provider ở đây để toàn bộ InnerDashboardLayout nằm trong Provider */}
        <Provider store={store}>
          <InnerDashboardLayout>{children}</InnerDashboardLayout>
        </Provider>
      </body>
    </html>
  );
}
