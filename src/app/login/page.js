"use client";

import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "../store/userSlice";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const { data } = await axios.post("/api/login", values);

      const user = data.data;

      dispatch(setCurrentUser(user));
      message.success("Đăng nhập thành công");

      const { position, quocgia } = user;

      // Điều hướng theo position
      if (["lead", "leadSALE", "managerMKT"].includes(position)) {
        router.push("/");
        return;
      }

      if (["managerSALE", "admin"].includes(position)) {
        router.push("/overviewall");
        return;
      }

      // Điều hướng theo quốc gia
      if (quocgia === "jp") {
        router.push("/ordersjp");
        return;
      }

      if (quocgia === "tw") {
        router.push("/orderstw");
        return;
      }

      router.push("/orders");

    } catch (error) {
      message.error(
        error?.response?.data?.error ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="card-title"> </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span style={{ fontWeight: 700 }}>Tài khoản</span>}
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
          >
            <Input placeholder="Nhập tài khoản" />
          </Form.Item>

          <Form.Item
           label={<span style={{ fontWeight: 700 }}>Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Button
            htmlType="submit"
            loading={loading}
            block
            className="gold-button"
          >
            Đăng nhập
          </Button>
        </Form>
      </Card>

      <style jsx global>{`
        /* ===== BACKGROUND ===== */
        .login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  
  
}

.login-container::before {
 align-items: flex-start;  /* không còn giữa */
       /* đẩy xuống 18% màn hình */
  padding-top: 10vh; 
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("/horse5.jpg");
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;

  /* Làm ảnh sáng và nét hơn */
  filter: brightness(1) contrast(1) saturate(1);

  z-index: -2;
}


}

        .login-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 0;
        }

        /* ===== CARD ===== */
        .login-card {
  width: 380px;

  background: linear-gradient(
    145deg,
    rgba(17,17,17,0.5) 0%,
    rgba(26,26,26,0.8) 100%
  ) !important;
   backdrop-filter: blur(10px);

  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);

  border-radius: 18px;
  border: 1px solid rgba(212, 175, 55, 0.6);

  box-shadow:
    0 0 25px rgba(212, 175, 55, 0.25),
    inset 0 0 20px rgba(212, 175, 55, 0.06);

  padding: 30px;
  z-index: 2;
}

        .card-title {
          color: #d4af37;
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 20px;
          letter-spacing: 1px;
          text-align: center;
        }

        /* ===== LABEL ===== */
        .ant-form-item-label label {
          color: #d4af37 !important;
        }

        /* ===== INPUT THƯỜNG ===== */
        .ant-input {
          background: #0d0d0d !important;
          border: 1px solid rgba(212, 175, 55, 0.6) !important;
          border-radius: 6px;
          color: #fff !important;
        }

        .ant-input:focus {
          border-color: #d4af37 !important;
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6) !important;
        }

        /* ===== PASSWORD WRAPPER ===== */
        .ant-input-affix-wrapper {
          background: #0d0d0d !important;
          border: 1px solid rgba(212, 175, 55, 0.6) !important;
          border-radius: 6px;
        }

        .ant-input-affix-wrapper:focus-within {
          border-color: #d4af37 !important;
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        }

        /* XÓA BORDER INPUT TRONG PASSWORD */
        .ant-input-affix-wrapper .ant-input {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        /* ===== BUTTON ===== */
        .gold-button.ant-btn {
          margin-top: 10px;
          height: 42px;
          font-weight: bold;
          border-radius: 6px;
          border: none !important;
          color: #000 !important;
          background: linear-gradient(
            135deg,
            #f5d76e 0%,
            #d4af37 40%,
            #b8860b 100%
          ) !important;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.6);
        }

        .gold-button.ant-btn:hover {
          background: linear-gradient(
            135deg,
            #ffe27a 0%,
            #e6c200 40%,
            #c79c0a 100%
          ) !important;
          box-shadow: 0 0 25px rgba(212, 175, 55, 0.9);
        }
      `}</style>
    </div>
  );
}
