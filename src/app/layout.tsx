"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { Layout, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store";
import { setCurrentUser } from "./store/userSlice";

import SidebarMenu from "./components/SidebarMenu";
import CurrentUserSelector from "./components/CurrentUserSelector";

const { Header, Content, Sider } = Layout;

/**
 * ✅ Định nghĩa kiểu `children` để tránh lỗi TypeScript
 */
function InnerDashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  // Lấy thông tin người dùng từ Redux store
  const currentUser = useSelector((state: any) => state.user.currentUser);

  // Kiểm tra nếu chưa đăng nhập, chuyển hướng về trang login
  useEffect(() => {
    if (!currentUser || !currentUser.username) {
      router.push("/login");
    }
  }, [currentUser, router]);

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
          width: "120%",
        }}
      >
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <div className="logo" style={{ color: "white", textAlign: "center", padding: "20px" }} />
          <SidebarMenu />
          <div className="logo" style={{ color: "white", textAlign: "center", height: "400px" }} />
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
 * ✅ Bọc `<Provider>` bên ngoài để tránh lỗi Redux
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <InnerDashboardLayout>{children}</InnerDashboardLayout>
        </Provider>
      </body>
    </html>
  );
}
