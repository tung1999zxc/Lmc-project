"use client";
import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import axios from "axios";
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setCurrentUser } from '../store/userSlice';

const LoginPage = () => {
  const router = useRouter();  


  const [loading, setLoading] = useState(false);
const dispatch= useDispatch();
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/login", values);
      message.success(response.data.message);
      if (response.data) {
        // Cập nhật thông tin người dùng hiện tại vào store
        dispatch(setCurrentUser({
          username: response.data.data.username,
          employee_code: response.data.data.employee_code,
          name: response.data.data.name,
          position: response.data.data.position,
          team_id: response.data.data.team_id,
          position_team: response.data.data.position_team,
        }));
      }
      // Ví dụ: chuyển hướng sang dashboard sau khi đăng nhập thành công
      router.push("/");
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        title="Đăng nhập"
        style={{
          width: 350,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
