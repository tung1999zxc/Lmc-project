"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, ReactNode, useState } from "react";

import { Button, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store";
import { setCurrentUser } from "./store/userSlice";
import { usePathname } from "next/navigation";
import SidebarMenu, { DynamicTimeTopbar } from "./components/SidebarMenu";
import CurrentUserSelector from "./components/CurrentUserSelector";
import { motion, useAnimation } from "framer-motion";
import GlobalNotification from "./components/GlobalNotification";
import MyRankBadge from "./components/MyRankBadge";
import { buildPageTitle } from "./utils/pageTitles";

const MotionHeader = motion.create("header");
const SidebarMenuComponent = SidebarMenu as unknown as React.ComponentType<{
  isOpen: boolean;
  onToggle: (open?: boolean) => void;
}>;

// LƯU Ý: `metadata` chỉ export được từ server component.
// Vì layout này là "use client" nên ta dùng document.title trong useEffect
// để đồng bộ tiêu đề tab theo pathname (xem InnerDashboardLayout + DashboardLayout).
// Fallback cho SSR: "LMC - Dashboard".

function InnerDashboardLayout({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Lấy thông tin người dùng từ Redux store
  const currentUser = useSelector((state: any) => state.user.currentUser);

  // Map position (MongoDB) -> tên hiển thị đồng bộ với bảng "📋 Báo cáo marketing"
  const getRoleLabel = (position: string) => {
    switch ((position || "").toLowerCase()) {
      case "lead":
        return "Leader MKT";
      case "leadsale":
        return "Leader SALE";
      case "managermkt":
        return "Manager MKT";
      case "managersale":
        return "Manager SALE";
      case "admin":
        return "Admin";
      case "kho2":
        return "Kho";
      case "khomalay2":
        return "Kho Malaysia";
      case "salenhapdon":
        return "Sale Nhập đơn";
      case "salefull":
        return "Sale Online";
      case "salexuly":
        return "Sale Xử Lý";
      default:
        return position || "Nhân viên";
    }
  };
  const roleLabel = getRoleLabel(currentUser?.position);

  // Đồng bộ <title> tab trình duyệt với pathname hiện tại (App Router không dùng next/head)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = buildPageTitle(pathname);
    }
  }, [pathname]);

  // Khởi tạo hiệu ứng đổi màu cho header với framer-motion
  const headerControls = useAnimation();

  // Kiểm tra nếu chưa đăng nhập, chuyển hướng về trang login
  useEffect(() => {
    if (!currentUser || !currentUser.username) {
      // Tránh push trùng khi đã đang ở /login
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [currentUser, router]);

  useEffect(() => {
    headerControls.start({
      background: "#111322",
    });
  }, [headerControls]);

  // Hàm logout
  const handleLogout = () => {
    // Set flag TRƯỚC mọi thứ để LoginPage biết cần chạy animation "đóng lại".
    if (typeof window !== "undefined") {
      sessionStorage.setItem("logout-curtain", "1");
    }
    // Reset user, dùng Redux + redirect ngay bằng router.replace (không đợi effect)
    dispatch(
      setCurrentUser({
        username: "",
        employee_code: 0,
        name: "",
        position: "",
        team_id: "",
        quocgia: "kr",
        khuvuc: "",
        position_team: "",
      })
    );
    router.replace("/login");
  };

  if (currentUser?.position === "kho2") {
    return <>{children}</>;
  }
  if (currentUser?.position === "khomalay2") {
    return <>{children}</>;
  }
  // Nếu chưa đăng nhập (bị dispatch clear khi logout hoặc truy cập trực tiếp),
  // KHÔNG render sidebar/header. handleLogout đã chủ động router.replace
  // nên không cần đợi effect.
  if (!currentUser || !currentUser.username) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "10%",
          right: "2%",
          width: "10%",
          height: "10%",
          // backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.6,
          zIndex: 1,
        }}
      />
      <div id="app">
        <SidebarMenuComponent isOpen={sidebarOpen} onToggle={toggleSidebar} />

        <div id="main">
          <MotionHeader
            id="topbar"
            animate={headerControls}
            style={{
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "64px",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            <div className="tb-l">
              <button className="tb-toggle" id="sb-btn" onClick={() => toggleSidebar()}>{sidebarOpen ? '☰' : '▶'}</button>
              <div className="tb-user">
                <div className="tb-name">{currentUser.name}</div>
                <div className="tb-role-badge" style={{ textTransform: "capitalize" }}>
                  ⭐ {roleLabel}
                </div>
              </div>
              <MyRankBadge />
            </div>
            <div className="tb-r">
              <DynamicTimeTopbar />
              <Button
                type="primary"
                icon={<LogoutOutlined />}
                danger
                onClick={handleLogout}
              >
                Đăng Xuất
              </Button>
            </div>
          </MotionHeader>
          <div id="content">
            {children}
          </div>
          {/* GlobalNotification luôn xuất hiện để thông báo mới đến cho người dùng */}
          <GlobalNotification />
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Đồng bộ title ngay cả ở nhánh /login (InnerDashboardLayout không mount ở đây)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = buildPageTitle(pathname);
    }
  }, [pathname]);

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
          <ConfigProvider locale={viVN}>
            <InnerDashboardLayout>{children}</InnerDashboardLayout>
          </ConfigProvider>
        </Provider>
      </body>
    </html>
  );
}
