"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { Layout, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store";
import { setCurrentUser } from "./store/userSlice";
import { usePathname } from "next/navigation";
import SidebarMenu from "./components/SidebarMenu";
import CurrentUserSelector from "./components/CurrentUserSelector";
import { motion, useAnimation } from "framer-motion";

const { Content, Sider } = Layout;
const MotionHeader = motion(Layout.Header);

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

  // Khởi tạo hiệu ứng đổi màu cho header với framer-motion
  const headerControls = useAnimation();

  useEffect(() => {
    headerControls.start({
      background: [
        "linear-gradient(90deg, #FF0000, #FF7F00)",
        "linear-gradient(90deg, #FF7F00, #FFFF00)",
        "linear-gradient(90deg, #FFFF00, #00FF00)",
        "linear-gradient(90deg, #00FF00, #0000FF)",
        "linear-gradient(90deg, #0000FF, #4B0082)",
        "linear-gradient(90deg, #4B0082, #9400D3)",
        "linear-gradient(90deg, #9400D3, #FF0000)",
      ],
      transition: { duration: 50, repeat: Infinity, repeatType: "mirror" }
    });
  }, [headerControls]);
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
      <Layout style={{ transform: "scale(1)" }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div
            className="logo"
            style={{ color: "white", textAlign: "center", padding: "20px" }}
          />
          <SidebarMenu />
          <div
            className="logo"
            style={{ color: "white", textAlign: "center", height: "400px" }}
          />
        </Sider>

        <Layout>
          <MotionHeader
            animate={headerControls}
            initial={{
              background: "linear-gradient(90deg, #4b6cb7, #182848)",
            }}
            style={{
              padding: "0 20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "64px",
              width: "100%",
              minWidth: "1000px",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                fontSize: "1.2em",
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              {currentUser.name}
            </div>
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              danger
              onClick={handleLogout}
            >
              Đăng Xuất
            </Button>
          </MotionHeader>
          <Content style={{ margin: "16px", minWidth: "1000px" }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body>
          <Provider store={store}>{children}</Provider>
        </body>
      </html>
    );
  }
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
