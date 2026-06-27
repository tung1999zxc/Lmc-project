"use client";

import { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "../store/userSlice";

const COMPANY_LEGAL_NAME = "CÔNG TY TNHH LMC GROUPS";
const COMPANY_DISPLAY_NAME = "LMC GROUPS";
const COMPANY_LOGO_URL = "lmc.jpg";

// ──────────────────────────────────────────────────────────────────────────────
// Canvas background: golden flowing curves (ported from HTML)
// ──────────────────────────────────────────────────────────────────────────────
function GoldenCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;
    const GOLD = "rgba(201,149,42,";
    const PALE = "rgba(255,220,120,";

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function rnd(a, b) { return a + (b - a) * Math.random(); }

    function mkCurve() {
      const W = canvas.width, H = canvas.height;
      return {
        ox: rnd(0, W), oy: rnd(0, H),
        ax: rnd(0.15, 0.45) * W, ay: rnd(0.12, 0.38) * H,
        bx: rnd(0.1, 0.4) * W,  by: rnd(0.1, 0.35) * H,
        px: rnd(0.0003, 0.0009) * (Math.random() < 0.5 ? 1 : -1),
        py: rnd(0.0003, 0.0009) * (Math.random() < 0.5 ? 1 : -1),
        qx: rnd(0.0002, 0.0008) * (Math.random() < 0.5 ? 1 : -1),
        qy: rnd(0.0002, 0.0008) * (Math.random() < 0.5 ? 1 : -1),
        rx: rnd(0.0001, 0.0006) * (Math.random() < 0.5 ? 1 : -1),
        ry: rnd(0.0001, 0.0006) * (Math.random() < 0.5 ? 1 : -1),
        ph: rnd(0, Math.PI * 2),
        spd: rnd(0.0004, 0.0012),
        alpha: rnd(0.04, 0.13),
        width: rnd(0.6, 2.2),
        len: rnd(0.55, 1.4),
        glowR: Math.random() < 0.3,
      };
    }

    const NUM = 18;
    const curves = Array.from({ length: NUM }, mkCurve);

    function evalCurve(c, tt) {
      const W = canvas.width, H = canvas.height;
      const pts = [];
      const N = 120;
      for (let s = 0; s <= N; s++) {
        const u = s / N;
        let x = c.ox
          + c.ax * Math.sin(u * Math.PI * 2 * c.len + tt * c.px + c.ph)
          + c.bx * Math.cos(u * Math.PI * 3.3 * c.len + tt * c.qx + c.ph * 1.3);
        let y = c.oy
          + c.ay * Math.cos(u * Math.PI * 2 * c.len + tt * c.py + c.ph * 0.7)
          + c.by * Math.sin(u * Math.PI * 3.7 * c.len + tt * c.qy + c.ph * 1.7);
        x += W * 0.12 * Math.sin(tt * c.rx + c.ph * 2.1);
        y += H * 0.10 * Math.cos(tt * c.ry + c.ph * 2.9);
        pts.push({ x, y });
      }
      return pts;
    }

    function drawCurve(c, tt) {
      const pts = evalCurve(c, tt);
      if (pts.length < 2) return;
      const pulse = 0.5 + 0.5 * Math.sin(tt * c.spd * 8 + c.ph);
      const alpha = c.alpha * (0.4 + 0.6 * pulse);

      ctx.save();
      ctx.lineWidth = c.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (c.glowR) {
        ctx.lineWidth = c.width * 4;
        ctx.strokeStyle = GOLD + (alpha * 0.2).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.stroke();
        ctx.lineWidth = c.width * 2;
      }

      const grd = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      grd.addColorStop(0,    GOLD + (alpha * 0.05).toFixed(3) + ")");
      grd.addColorStop(0.25, GOLD + (alpha * 0.9).toFixed(3) + ")");
      grd.addColorStop(0.5,  PALE + (alpha * 1.0).toFixed(3) + ")");
      grd.addColorStop(0.75, GOLD + (alpha * 0.85).toFixed(3) + ")");
      grd.addColorStop(1,    GOLD + (alpha * 0.05).toFixed(3) + ")");

      ctx.strokeStyle = grd;
      ctx.lineWidth = c.width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.stroke();
      ctx.restore();
    }

    function drawAmbient(tt) {
      const W = canvas.width, H = canvas.height;
      const pulse = 0.5 + 0.5 * Math.sin(tt * 0.018);
      const cx = W / 2, cy = H / 2;
      const rg = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy * 0.6, Math.max(W, H) * 0.55);
      rg.addColorStop(0,   GOLD + (0.04 + pulse * 0.035).toFixed(3) + ")");
      rg.addColorStop(0.4, GOLD + "0.015)");
      rg.addColorStop(1,   GOLD + "0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAmbient(t);
      curves.forEach((c) => drawCurve(c, t));
      t += 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Curtain intro animation
// ──────────────────────────────────────────────────────────────────────────────
function Curtain() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Match HTML: curtain fades at 3s, panels slide at 1.6s for 1.2s
    const timer = setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div style={styles.curtain}>
      <div style={styles.curtainLeft} />
      <div style={styles.curtainRight} />
      <div style={styles.curtainSeam} />
      <div style={styles.curtainLogo}>
        <div style={styles.curtainLogoRing}>
          <img src={COMPANY_LOGO_URL} alt={COMPANY_DISPLAY_NAME} style={styles.curtainLogoImg} />
        </div>
        <div style={styles.curtainWordmark}>{COMPANY_DISPLAY_NAME}</div>
        <div style={styles.curtainTagline}>{COMPANY_LEGAL_NAME}</div>
      </div>
      <style>{curtainKeyframes}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Corner ornament SVG
// ──────────────────────────────────────────────────────────────────────────────
function Orn({ style }) {
  return (
    <div style={{ ...styles.orn, ...style }}>
      <svg viewBox="0 0 20 20" width="20" height="20">
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="#c9952a" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="2" fill="#c9952a" />
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main LoginPage
// ──────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    // Card appears after curtain exits (~3.6s)
    const t = setTimeout(() => setShowCard(true), 3600);
    return () => clearTimeout(t);
  }, []);

  // ── Original logic unchanged ──────────────────────────────────────────────
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
      if (quocgia === "tw") {
        router.push("/orderstw");
        return;
      }
      router.push("/orders");
    } catch (error) {
      message.error(
        error?.response?.data?.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại!"
      );
    } finally {
      setLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      {/* Radial dark-gold background */}
      <div style={styles.bg} />

      {/* Animated golden curves */}
      <GoldenCanvas />

      {/* Curtain intro */}
      <Curtain />

      {/* Login card */}
      <div
        style={{
          ...styles.cardWrap,
          opacity: showCard ? 1 : 0,
          transform: showCard ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)",
          transition: "opacity 0.9s cubic-bezier(.34,1.2,.64,1), transform 0.9s cubic-bezier(.34,1.2,.64,1)",
        }}
      >
        {/* Aura glow behind card */}
        <div style={styles.aura} />

        <div style={styles.card}>
          {/* Top line accent */}
          <div style={styles.cardTopLine} />
          {/* Radial inner glow */}
          <div style={styles.cardInnerGlow} />

          {/* Corner ornaments */}
          <Orn style={{ top: 10, left: 10 }} />
          <Orn style={{ top: 10, right: 10, transform: "scaleX(-1)" }} />
          <Orn style={{ bottom: 10, left: 10, transform: "scaleY(-1)" }} />
          <Orn style={{ bottom: 10, right: 10, transform: "scale(-1,-1)" }} />

          {/* Header: logo + brand */}
          <div style={styles.hdr}>
            <div style={styles.logoOuter}>
              <div style={styles.logoSpinRing} />
              <img src={COMPANY_LOGO_URL} alt={COMPANY_DISPLAY_NAME} style={styles.logoImg} />
            </div>
            <div style={styles.brand}>{COMPANY_DISPLAY_NAME}</div>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerIcon}>◆ ✦ ◆</span>
            <div style={{ ...styles.dividerLine, background: "linear-gradient(to left, transparent, #c9952a55)" }} />
          </div>

          {/* Form — Ant Design components keep original field names & validation */}
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
            >
              <div>
                <label style={styles.flabel}>Tài Khoản</label>
                <Form.Item name="username" noStyle rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}>
                  <Input
                    placeholder="Nhập tài khoản"
                    style={styles.finput}
                    className="gold-input"
                  />
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              style={{ marginBottom: 0 }}
            >
              <div>
                <label style={styles.flabel}>Mật Khẩu</label>
                <Form.Item name="password" noStyle rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
                  <Input.Password
                    placeholder="Nhập mật khẩu"
                    style={{ ...styles.finput, paddingRight: 42 }}
                    className="gold-input"
                  />
                </Form.Item>
              </div>
            </Form.Item>

            <Button
              htmlType="submit"
              loading={loading}
              block
              style={styles.btn}
              className="gold-btn"
            >
              ✦ &nbsp; Đăng Nhập &nbsp; ✦
            </Button>
          </Form>

          {/* Seal */}
          <div style={styles.seal}>— {COMPANY_LEGAL_NAME} —</div>
        </div>
      </div>

      {/* Global styles for Ant Design overrides */}
      <style>{globalCSS}</style>
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
    fontFamily: "'Georgia', serif",
    background: "#000",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 50% 0%, #1a0e00 0%, #0a0500 40%, #000 100%)",
    zIndex: 0,
  },
  // ── Curtain ──
  curtain: {
    position: "absolute",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    animation: "curtainFade 0.6s ease-out 3s forwards",
  },
  curtainLeft: {
    position: "absolute",
    top: 0, bottom: 0, left: 0,
    width: "50%",
    background: "linear-gradient(to bottom, #0d0700, #1a0e00, #0d0700)",
    borderRight: "1px solid #c9952a44",
    animation: "slideLeft 1.2s cubic-bezier(.77,0,.175,1) 1.6s forwards",
  },
  curtainRight: {
    position: "absolute",
    top: 0, bottom: 0, right: 0,
    width: "50%",
    background: "linear-gradient(to bottom, #0d0700, #1a0e00, #0d0700)",
    borderLeft: "1px solid #c9952a44",
    animation: "slideRight 1.2s cubic-bezier(.77,0,.175,1) 1.6s forwards",
  },
  curtainSeam: {
    position: "absolute",
    top: 0, bottom: 0, left: "50%",
    width: 2,
    background: "linear-gradient(to bottom, transparent, #fff9e6, #c9952a, #fff9e6, transparent)",
    transform: "translateX(-50%)",
    animation: "seamGlow 1.5s ease-out 1s forwards",
    opacity: 0,
  },
  curtainLogo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    animation: "logoZoom 0.9s cubic-bezier(.34,1.56,.64,1) 0.3s both",
    zIndex: 1,
  },
  curtainLogoRing: {
    width: 130,
    height: 130,
    borderRadius: "50%",
    border: "2px solid #c9952a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    animation: "ringPulse 1.5s ease-in-out infinite",
    overflow: "hidden",
    background: "#0a0600",
  },
  curtainLogoImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  curtainWordmark: {
    color: "#c9952a",
    fontSize: 28,
    letterSpacing: 10,
    fontWeight: "bold",
    textShadow: "0 0 30px #c9952a, 0 0 60px #c9952a55",
    animation: "wordmarkFlicker 0.1s linear 0.8s 3",
  },
  curtainTagline: {
    color: "#c9952a77",
    fontSize: 10,
    letterSpacing: 5,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
  // ── Card ──
  cardWrap: {
    position: "relative",
    zIndex: 10,
    width: 400,
  },
  aura: {
    position: "absolute",
    inset: -40,
    borderRadius: 60,
    background: "radial-gradient(ellipse, #c9952a18 0%, transparent 70%)",
    animation: "auraPulse 4s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    background: "linear-gradient(160deg, #2a1a00 0%, #1a0f00 50%, #2a1a00 100%)",
    borderRadius: 20,
    border: "1px solid #c9952a66",
    padding: "40px 36px 36px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 40px #c9952a18, 0 8px 32px #00000088",
  },
  cardTopLine: {
    position: "absolute",
    top: 0, left: "15%", right: "15%",
    height: 1,
    background: "linear-gradient(to right, transparent, #c9952a, #fff9e6, #c9952a, transparent)",
  },
  cardInnerGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    background: "radial-gradient(ellipse at 50% -5%, #c9952a1a 0%, transparent 55%)",
    pointerEvents: "none",
  },
  orn: {
    position: "absolute",
    width: 20,
    height: 20,
  },
  hdr: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
  },
  logoOuter: {
    width: 82,
    height: 82,
    borderRadius: "50%",
    border: "2px solid #c9952a88",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 14,
    animation: "logoGlow 4s ease-in-out infinite",
    overflow: "hidden",
    background: "#0a0600",
  },
  logoSpinRing: {
    position: "absolute",
    inset: -6,
    borderRadius: "50%",
    border: "1px solid #c9952a22",
    animation: "spinRing 10s linear infinite",
    zIndex: 2,
    pointerEvents: "none",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  brand: {
    color: "#c9952a",
    fontSize: 17,
    letterSpacing: 7,
    fontWeight: "bold",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "20px 0 24px",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "linear-gradient(to right, transparent, #c9952a55)",
  },
  dividerIcon: {
    color: "#c9952a",
    fontSize: 12,
  },
  flabel: {
    display: "block",
    color: "#c9952a99",
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
    marginBottom: 7,
    paddingLeft: 2,
  },
  finput: {
    width: "100%",
    background: "#120900",
    border: "1px solid #c9952a44",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#f0d890",
    fontSize: 14,
    fontFamily: "sans-serif",
    outline: "none",
    caretColor: "#c9952a",
  },
  btn: {
    width: "100%",
    marginTop: 22,
    padding: 14,
    height: "auto",
    background: "linear-gradient(90deg, #8b5e0a, #c9952a, #f0c84a, #c9952a, #8b5e0a)",
    backgroundSize: "300% 100%",
    border: "none",
    borderRadius: 8,
    color: "#0a0500",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 5,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
    cursor: "pointer",
    animation: "btnShimmer 3s linear infinite",
  },
  seal: {
    textAlign: "center",
    marginTop: 22,
    color: "#c9952a33",
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Curtain keyframes (injected as a <style> tag inside the curtain)
// ──────────────────────────────────────────────────────────────────────────────
const curtainKeyframes = `
  @keyframes curtainFade { to { opacity: 0; pointer-events: none; } }
  @keyframes slideLeft   { to { transform: translateX(-100%); } }
  @keyframes slideRight  { to { transform: translateX(100%); } }
  @keyframes seamGlow {
    0%   { opacity: 0; }
    30%  { opacity: 1; box-shadow: 0 0 20px 4px #c9952a; }
    70%  { opacity: 1; box-shadow: 0 0 30px 8px #fff9e6; }
    100% { opacity: 0; }
  }
  @keyframes logoZoom { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
  @keyframes ringPulse {
    0%,100% { box-shadow: 0 0 0 0 #c9952a00, 0 0 20px #c9952a55; }
    50%     { box-shadow: 0 0 0 10px #c9952a22, 0 0 50px #c9952a99; }
  }
  @keyframes spinRing   { to { transform: rotate(360deg); } }
  @keyframes wordmarkFlicker { 50% { opacity: 0.6; } }
`;

// ──────────────────────────────────────────────────────────────────────────────
// Global CSS — Ant Design overrides + card animations
// ──────────────────────────────────────────────────────────────────────────────
const globalCSS = `
  @keyframes auraPulse {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.05); }
  }
  @keyframes logoGlow {
    0%,100% { box-shadow: 0 0 12px #c9952a55; }
    50%     { box-shadow: 0 0 28px #c9952aaa, 0 0 50px #c9952a44; }
  }
  @keyframes btnShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Ant Design input overrides */
  .gold-input .ant-input,
  .gold-input {
    background: #120900 !important;
    border: 1px solid #c9952a44 !important;
    border-radius: 8px !important;
    color: #f0d890 !important;
    caret-color: #c9952a !important;
  }
  .gold-input .ant-input:focus,
  .gold-input:focus {
    border-color: #c9952aaa !important;
    box-shadow: 0 0 0 1px #c9952a33, 0 0 18px #c9952a22, inset 0 0 8px #c9952a0f !important;
    background: #180d00 !important;
  }
  .gold-input .ant-input::placeholder,
  .gold-input::placeholder { color: #c9952a44 !important; }

  /* Password wrapper */
  .ant-input-affix-wrapper.gold-input {
    background: #120900 !important;
    border: 1px solid #c9952a44 !important;
    border-radius: 8px !important;
    padding: 0 !important;
  }
  .ant-input-affix-wrapper.gold-input input.ant-input {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 12px 16px !important;
  }
  .ant-input-affix-wrapper.gold-input:focus-within {
    border-color: #c9952aaa !important;
    box-shadow: 0 0 0 1px #c9952a33, 0 0 18px #c9952a22 !important;
  }
  .ant-input-affix-wrapper.gold-input .ant-input-suffix svg,
  .ant-input-affix-wrapper.gold-input .ant-input-password-icon {
    color: #c9952a66 !important;
  }
  .ant-input-affix-wrapper.gold-input .ant-input-password-icon:hover {
    color: #c9952a !important;
  }

  /* Form labels */
  .ant-form-item-label label { color: #c9952a99 !important; }

  /* Error messages */
  .ant-form-item-explain-error { color: #e08840 !important; font-size: 11px; }

  /* Button */
  .gold-btn.ant-btn,
  .gold-btn.ant-btn:not(:disabled) {
    background: linear-gradient(90deg, #8b5e0a, #c9952a, #f0c84a, #c9952a, #8b5e0a) !important;
    background-size: 300% 100% !important;
    border: none !important;
    color: #0a0500 !important;
    animation: btnShimmer 3s linear infinite !important;
    box-shadow: 0 0 18px #c9952a44 !important;
  }
  .gold-btn.ant-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px #c9952a55 !important;
    opacity: 1 !important;
  }
  .gold-btn.ant-btn:active { transform: scale(0.98); }

  @media (max-width: 480px) {
    div[style*="width: 400px"] { width: calc(100% - 32px) !important; max-width: 400px !important; }
  }
`;
