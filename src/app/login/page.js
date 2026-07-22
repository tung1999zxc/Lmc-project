"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "../store/userSlice";

const COMPANY_DISPLAY_NAME = "LMC GROUPS";
const COMPANY_LOGO_URL = "lmc.jpg";

// ──────────────────────────────────────────────────────────────────────────────
// Countdown Timer Component
// ──────────────────────────────────────────────────────────────────────────────
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date("2026-07-22T20:00:00+07:00");

    function updateCountdown() {
      const now = new Date();
      let diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff %= 1000 * 60 * 60;
      const minutes = Math.floor(diff / (1000 * 60));
      diff %= 1000 * 60;
      const seconds = Math.floor(diff / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.countContainer}>
      <div style={styles.countBox}>
        <div style={styles.num}>{String(timeLeft.hours).padStart(2, "0")}</div>
        <div style={styles.label}>GIỜ</div>
      </div>
      <div style={styles.num}>:</div>
      <div style={styles.countBox}>
        <div style={styles.num}>
          {String(timeLeft.minutes).padStart(2, "0")}
        </div>
        <div style={styles.label}>PHÚT</div>
      </div>
      <div style={styles.num}>:</div>
      <div style={styles.countBox}>
        <div style={styles.num}>
          {String(timeLeft.seconds).padStart(2, "0")}
        </div>
        <div style={styles.label}>GIÂY</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main LoginPage
// ──────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  // ── Original logic — UNCHANGED ─────────────────────────────────────────────
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/login", values);
      const user = data.data;
      dispatch(setCurrentUser(user));
      message.success("Đăng nhập thành công");

      const { position, quocgia } = user;

      if (["lead", "leadSALE", "managerMKT"].includes(position)) {
        router.push("/");
        return;
      }
      if (["managerSALE", "admin"].includes(position)) {
        router.push("/overviewall");
        return;
      }
      if (quocgia === "jp") {
        router.push("/ordersjp");
        return;
      }
      if (position === "kho2" && quocgia === "kr") {
        router.push("/orderkhohanh");
        return;
      }
      if (position === "kho2") {
        router.push("/orderkho");
        return;
      }
      if (position === "khomalay2") {
        router.push("/orderkhomalay");
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
          "Đăng nhập thất bại. Vui lòng kiểm tra lại!",
      );
    } finally {
      setLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      <style>{globalCSS}</style>

      {/* Main Container - Single Card Frame */}
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerBadge}>
            <span>✦</span>
          </div>
          <h1 style={styles.headerTitle}>Đón chờ giao diện mới</h1>
          <p style={styles.headerSubtitle}>LMC Group</p>
          <p style={styles.headerDate}>
            20:00, 22.07.2026 | Trực tiếp tại lmcgroupss.com
          </p>
        </div>

        {/* Countdown Section */}
        <CountdownTimer />

        {/* Divider */}
        <div style={styles.divider}></div>

        {/* Login Form Section */}
        <div style={styles.formSection}>
          <div style={styles.logoWrapper}>
            <img
              src={COMPANY_LOGO_URL}
              alt={COMPANY_DISPLAY_NAME}
              style={styles.logo}
            />
          </div>

          <Form layout="vertical" onFinish={onFinish} style={styles.form}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
            >
              <Input
                placeholder="Nhập tài khoản"
                className="modern-input"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu"
                className="modern-input"
                style={styles.input}
              />
            </Form.Item>

            <Button
              htmlType="submit"
              loading={loading}
              block
              className="modern-btn"
              style={styles.button}
            >
              Đăng Nhập
            </Button>
          </Form>
        </div>

        {/* Voucher Section */}
        <div style={styles.voucherSection}>
          <div style={styles.voucher}>
            <div style={styles.voucherLeft}>Đón xem</div>
            <div style={styles.voucherRight}>
              <h1 style={styles.voucherNum}>2.0</h1>
              <div style={styles.voucherText}>
                Version
                <br />
                <strong>LMC Group</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <p style={styles.note}>
          Giao diện mới được nâng cấp với thiết kế hiện đại, tối ưu trải nghiệm
          người dùng và hiệu suất trên mọi thiết bị.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(135deg, #e8e6e4 0%, #c5c3c1 100%)",
    padding: "20px",
  },
  mainContainer: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 24,
    padding: "40px 36px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
  },
  // Header
  header: {
    textAlign: "center",
  },
  headerBadge: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #d6d4ff, #adc7ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    fontSize: 28,
    color: "#4987ff",
    boxShadow: "0 8px 20px rgba(77, 135, 255, 0.25)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
    lineHeight: 1.3,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#333",
    margin: "8px 0 4px",
  },
  headerDate: {
    fontSize: 14,
    color: "#888",
    margin: 0,
  },
  // Countdown
  countContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  countBox: {
    textAlign: "center",
  },
  num: {
    fontSize: 48,
    fontWeight: 700,
    color: "#1a1a1a",
    lineHeight: 1,
  },
  label: {
    fontSize: 11,
    color: "#888",
    letterSpacing: 2,
    marginTop: 4,
  },
  // Divider
  divider: {
    width: "100%",
    height: 1,
    background: "linear-gradient(to right, transparent, #e0e0e0, transparent)",
  },
  // Form Section
  formSection: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #f0f0f0",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  input: {
    width: "100%",
    height: 48,
    background: "#f8f8f8",
    border: "1px solid #e8e8e8",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 15,
    fontFamily: "'Poppins', sans-serif",
  },
  button: {
    width: "100%",
    height: 50,
    background: "linear-gradient(135deg, #4987ff 0%, #1d4cff 100%)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(77, 135, 255, 0.35)",
    transition: "all 0.3s ease",
  },
  // Voucher
  voucherSection: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  voucher: {
    width: "100%",
    maxWidth: 300,
    height: 80,
    background: "linear-gradient(90deg, #d6d4ff 0%, #adc7ff 100%)",
    borderRadius: 12,
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
  },
  voucherLeft: {
    width: 55,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    writingMode: "vertical-lr",
    transform: "rotate(180deg)",
    fontSize: 15,
    fontWeight: 600,
    color: "#555",
    borderRight: "2px dashed rgba(255,255,255,0.6)",
  },
  voucherRight: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "0 16px",
  },
  voucherNum: {
    color: "#1d4cff",
    fontSize: 40,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1,
  },
  voucherText: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
    color: "#333",
  },
  // Note
  note: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 340,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Global CSS
// ──────────────────────────────────────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Poppins', sans-serif;
  }

  /* Input styles */
  .modern-input {
    background: #f8f8f8 !important;
    border: 1px solid #e8e8e8 !important;
    border-radius: 12px !important;
    height: 48px !important;
  }
  .modern-input:hover {
    border-color: #c0c0c0 !important;
  }
  .modern-input .ant-input,
  .modern-input input {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 16px !important;
    height: 46px !important;
    font-size: 15px !important;
    color: #333 !important;
  }
  .modern-input:focus,
  .modern-input.ant-input-affix-wrapper-focused {
    border-color: #4987ff !important;
    background: #fff !important;
    box-shadow: 0 0 0 3px rgba(77, 135, 255, 0.15) !important;
  }
  .modern-input::placeholder {
    color: #aaa !important;
  }
  
  /* Password toggle */
  .modern-input .ant-input-password-icon {
    color: #999 !important;
  }
  .modern-input .ant-input-password-icon:hover {
    color: #4987ff !important;
  }

  /* Button styles */
  .modern-btn {
    height: 50px !important;
    background: linear-gradient(135deg, #4987ff 0%, #1d4cff 100%) !important;
    border: none !important;
    border-radius: 12px !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #fff !important;
    box-shadow: 0 6px 20px rgba(77, 135, 255, 0.35) !important;
    transition: all 0.3s ease !important;
  }
  .modern-btn:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(77, 135, 255, 0.45) !important;
    opacity: 1 !important;
    background: linear-gradient(135deg, #4987ff 0%, #1d4cff 100%) !important;
  }
  .modern-btn:active {
    transform: translateY(0) !important;
  }

  /* Error message */
  .ant-form-item-explain-error {
    color: #ff4d4f !important;
    font-size: 12px !important;
    margin-top: 4px !important;
  }

  /* Responsive */
  @media (max-width: 520px) {
    div[style*="maxWidth: 480"] {
      max-width: 100% !important;
      padding: 30px 24px !important;
      border-radius: 20px !important;
    }
    .headerTitle {
      font-size: 24px !important;
    }
    .num {
      font-size: 36px !important;
    }
    .voucher {
      max-width: 260px !important;
      height: 70px !important;
    }
    .voucherNum {
      font-size: 32px !important;
    }
  }
`;
