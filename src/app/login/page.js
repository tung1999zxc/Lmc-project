"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import axios from "axios";
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setCurrentUser } from '../store/userSlice';
import { motion, useAnimation } from 'framer-motion';

// Thông tin doanh nghiệp hiển thị trên trang (dễ chỉnh sửa)
const COMPANY_LEGAL_NAME = 'CÔNG TY TNHH LMC GROUPS';
const COMPANY_DISPLAY_NAME = 'LMC GROUPS';
const COMPANY_LOGO_URL = 'lmc.jpg'; // Thay bằng link logo thực tế của bạn sau
const COMPANY_WEBSITE = 'https://lmcgroupss.com'; // Thay nếu cần

const LoginPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const controls = useAnimation();
  const [isMounted, setIsMounted] = useState(false); // Thêm state để kiểm soát mount

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/login", values);
      message.success(response.data.message);
      if (response.data) {
        dispatch(setCurrentUser({
          username: response.data.data.username,
          employee_code: response.data.data.employee_code,
          name: response.data.data.name,
          position: response.data.data.position,
          team_id: response.data.data.team_id,
          position_team: response.data.data.position_team,
        }));
      }
      if (response.data.data.position === "lead" ||response.data.data.position === "leadSALE"||response.data.data.position==="managerMKT"){
        router.push("/");
      }
      else if(response.data.data.position === "managerSALE"||response.data.data.position==="admin"){
        router.push("/overviewall");
      }
      else if(response.data.data.position === "mkt" && response.data.data.quocgia === "jp" && response.data.data.quocgia === "tw"){
        router.push("/mkt");
      }
      else if(response.data.data.quocgia === "jp"){
        router.push("/ordersjp");
      }
      else if(response.data.data.quocgia === "tw"){
        router.push("/orderstw");
      }
      
      else {
        router.push("/orders");
      }
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  // Hiệu ứng đổi màu cầu vồng liên tục
  useEffect(() => {
    const animateBackground = async () => {
      await controls.start({
        background: [
          "linear-gradient(135deg, #FF0000 0%, #FF7F00 100%)",
          "linear-gradient(135deg, #FF7F00 0%, #FFFF00 100%)",
          "linear-gradient(135deg, #FFFF00 0%, #00FF00 100%)",
          "linear-gradient(135deg, #00FF00 0%, #0000FF 100%)",
          "linear-gradient(135deg, #0000FF 0%, #4B0082 100%)",
          "linear-gradient(135deg, #4B0082 0%, #9400D3 100%)",
          "linear-gradient(135deg, #9400D3 0%, #FF0000 100%)",
        ],
        transition: { duration: 20, repeat: Infinity, repeatType: "mirror" },
      });
    };
    animateBackground();
  }, [controls]);

  // Mảng chứa các hình ảnh rơi
  const fallingImages = [
    
    // "/6.jpg",
    // "/7.jpg",
    // "/8.jpg",
    // "/9.jpg",
    // "/10.jpg",
    // "/11.jpg",
    // "/12.jpg",
    // "/13.jpg",
    // "/14.jpg",
    // "/15.jpg",
    // "/16.jpg",
    // "/17.jpg",
    // "/18.jpg",
    // "/19.jpg",
    // "/20.jpg",
  ];

  // Tạo hiệu ứng rơi với nhiều loại ảnh (CHỈ CHẠY TRÊN CLIENT)
  const FallingItems = () => {
    if (!isMounted) return null; // Không render gì nếu chưa mount

    const items = Array.from({ length: 50 }).map((_, index) => {
      const size = Math.random() * 300 + 10;
      const delay = Math.random() * 10;
      const duration = Math.random() * 15 + 5;
      const left = Math.random() * 100;
      const image = fallingImages[Math.floor(Math.random() * fallingImages.length)];

      return (
        <motion.div
          key={index}
          style={{
            position: "absolute",
            top: "-10%",
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundImage: `url('${image}')`,
            backgroundSize: "cover",
            zIndex: 0,
          }}
          initial={{ y: -100, rotate: 0 }}
          animate={{ y: "100vh", rotate: 0 }}
          transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      );
    });

    return <>{items}</>;
  };

  // Đánh dấu component đã mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background Animation */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
        animate={controls}
      />

      {/* Hiệu ứng rơi chỉ render khi đã mount */}
      <FallingItems />

      {/* HEADER: hiển thị tên pháp lý và logo công ty để Facebook có thể xác minh */}
      <header
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(56, 255, 6, 0.85)',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,1)'
        }}
        aria-label="Thông tin công ty"
      >
        <img
          src={COMPANY_LOGO_URL}
          alt={`${COMPANY_DISPLAY_NAME} logo`}
          width={190}
          height={60}
          style={{ objectFit: 'contain', display: 'block' }}
        />
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 20}}>{COMPANY_DISPLAY_NAME}</div>
          <div style={{ fontSize: 18, color: '#000000ff' }}>{COMPANY_LEGAL_NAME}</div>
          <a href={COMPANY_WEBSITE} style={{ fontSize: 16, color: '#096dd9' }}>{COMPANY_WEBSITE}</a>
        </div>
      </header>

      {/* Hiển thị thêm một phần footer nhỏ (cùng nội dung) để đảm bảo hiển thị rõ ràng */}
      <footer
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          background: 'rgba(255,255,255,0.85)',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
        aria-hidden={false}
      >
        <strong>{COMPANY_LEGAL_NAME}</strong> — Trang web: <a href={COMPANY_WEBSITE}>{COMPANY_WEBSITE}</a>
      </footer>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 20,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Card
          title="Đăng nhập"
          style={{
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            background: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Tài khoản"
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
            >
              <Input placeholder="Nhập tài khoản" />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
            <Form.Item>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "linear-gradient(135deg, #FF0000 0%, #FF7F00 100%)",
                  borderRadius: 4,
                }}
                animate={{
                  background: [
                    "linear-gradient(135deg, #FF0000 0%, #FF7F00 100%)",
                    "linear-gradient(135deg, #FF7F00 0%, #FFFF00 100%)",
                    "linear-gradient(135deg, #FFFF00 0%, #00FF00 100%)",
                    "linear-gradient(135deg, #00FF00 0%, #0000FF 100%)",
                    "linear-gradient(135deg, #0000FF 0%, #4B0082 100%)",
                    "linear-gradient(135deg, #4B0082 0%, #9400D3 100%)",
                    "linear-gradient(135deg, #9400D3 0%, #FF0000 100%)",
                  ],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "mirror",
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#fff",
                  }}
                >
                  Đăng nhập
                </Button>
              </motion.div>
            </Form.Item>
          </Form>
        </Card>
      </motion.div>

    </div>
  );
};

export default LoginPage;
