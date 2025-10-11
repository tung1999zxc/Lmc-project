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
// import PraiseBanner2 from './components/PraiseBanner2'
import Script from "next/script";
// import CurrentUserSelector from "./components/CurrentUserSelector";
import { motion, useAnimation } from "framer-motion";
import GlobalNotification from "./components/GlobalNotification";

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
      transition: { duration: 50, repeat: Infinity, repeatType: "mirror" },
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
          // backgroundImage: "url('/background.png')",
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
            {/* <CurrentUserSelector />
          <PraiseBanner2 /> */}
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
          {/* GlobalNotification luôn xuất hiện để thông báo mới đến cho người dùng */}
          <GlobalNotification />
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
          <Script
            id="chatango-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
          (function() {
            var wrapper = document.createElement("div");
            wrapper.id = "chatango-wrapper";
            wrapper.style.position = "fixed";
            wrapper.style.bottom = "80px";
            wrapper.style.right = "20px";
            wrapper.style.zIndex = "99999";
            wrapper.style.borderRadius = "10px";
            wrapper.style.overflow = "hidden";
            wrapper.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
            wrapper.style.background = "white";
            wrapper.style.width = "307px";
            wrapper.style.height = "765px";
            wrapper.style.display = "block";

            var chatango = document.createElement("script");
            chatango.id = "cid0020000361180134082";
            chatango.src = "//st.chatango.com/js/gz/emb.js";
            chatango.async = true;
            chatango.setAttribute("data-cfasync", "false");
            chatango.style.width = "307px";
            chatango.style.height = "765px";
            chatango.innerHTML = '{"handle":"lmcroom","arch":"js","styles":{"a":"33cc00","b":100,"c":"FFFFFF","d":"FFFFFF","k":"33cc00","l":"33cc00","m":"33cc00","n":"FFFFFF","p":"11","q":"33cc00","r":100,"usricon":0,"surl":0,"cnrs":"0.74","fwtickm":1}}';

            wrapper.appendChild(chatango);
            document.body.appendChild(wrapper);

            var toggleButton = document.createElement("button");
            toggleButton.id = "chatango-toggle";
            toggleButton.innerHTML = "💬";
            toggleButton.style.position = "fixed";
            toggleButton.style.bottom = "20px";
            toggleButton.style.right = "20px";
            toggleButton.style.width = "60px";
            toggleButton.style.height = "60px";
            toggleButton.style.borderRadius = "50%";
            toggleButton.style.border = "none";
            toggleButton.style.background = "#0078FF";
            toggleButton.style.color = "white";
            toggleButton.style.fontSize = "28px";
            toggleButton.style.cursor = "pointer";
            toggleButton.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
            toggleButton.style.zIndex = "100000";

            toggleButton.onmouseenter = () => toggleButton.style.background = "#005FCC";
            toggleButton.onmouseleave = () => toggleButton.style.background = "#0078FF";

            toggleButton.onclick = function() {
              var chatBox = document.getElementById("chatango-wrapper");
              if (!chatBox) return;
              if (chatBox.style.display === "none") {
                chatBox.style.display = "block";
              } else {
                chatBox.style.display = "none";
              }
            };

            document.body.appendChild(toggleButton);

            // ✅ CSS ẩn tiêu đề mặc định của Chatango
            var style = document.createElement('style');
            style.innerHTML = \`
              #chatango-wrapper iframe {
                border: none !important;
              }
              #chatango-wrapper .cg-head,
              #chatango-wrapper .cg-titlebar,
              #chatango-wrapper .chtitle,
              #chatango-wrapper .header,
              #chatango-wrapper [id*="title"] {
                display: none !important;
                height: 0 !important;
                overflow: hidden !important;
              }
            \`;
            document.head.appendChild(style);
          })();
        `,
            }}
          />
        </Provider>
        {/* 👇 Thêm đoạn này ngay trước </body> */}




      </body>
    </html>
  );
}
