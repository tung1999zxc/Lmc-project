"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "../store/userSlice";

const COMPANY_LEGAL_NAME = "CÔNG TY TNHH LMC GROUPS";
const COMPANY_DISPLAY_NAME = "LMC GROUPS";
const COMPANY_LOGO_URL = "lmc.jpg";

// ──────────────────────────────────────────────────────────────────────────────
// Canvas background: golden flowing curves — ported 1-to-1 from HTML
// ──────────────────────────────────────────────────────────────────────────────
function GoldenCanvas({ onReady }) {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;
    const GOLD = "rgba(255,215,0,";
    const PALE = "rgba(255,235,140,";

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
        bx: rnd(0.1,  0.4)  * W, by: rnd(0.1,  0.35) * H,
        px: rnd(0.0003, 0.0009) * (Math.random() < 0.5 ? 1 : -1),
        py: rnd(0.0003, 0.0009) * (Math.random() < 0.5 ? 1 : -1),
        qx: rnd(0.0002, 0.0008) * (Math.random() < 0.5 ? 1 : -1),
        qy: rnd(0.0002, 0.0008) * (Math.random() < 0.5 ? 1 : -1),
        rx: rnd(0.0001, 0.0006) * (Math.random() < 0.5 ? 1 : -1),
        ry: rnd(0.0001, 0.0006) * (Math.random() < 0.5 ? 1 : -1),
        ph:  rnd(0, Math.PI * 2),
        spd: rnd(0.0004, 0.0012),
        alpha: rnd(0.2, 0.45),          // HTML values
        width: rnd(1.0, 3.0),
        len:   rnd(0.55, 1.4),
        glowR: Math.random() < 0.6,
      };
    }

    const NUM = 18; // Giảm từ 30 để tăng performance
    const curves = Array.from({ length: NUM }, mkCurve);

    function evalCurve(c, tt) {
      const W = canvas.width, H = canvas.height;
      const pts = [];
      const N = 60; // Giảm từ 120 điểm xuống 60
      const TWO_PI = Math.PI * 2;
      const lenPx = c.len;
      const ax = c.ax, ay = c.ay, bx = c.bx, by = c.by;
      const px = c.px, py = c.py, qx = c.qx, qy = c.qy;
      const rx = c.rx, ry = c.ry, ph = c.ph;
      const W_012 = W * 0.12, H_010 = H * 0.10;

      for (let s = 0; s <= N; s++) {
        const u = s / N;
        let x = c.ox
          + ax * Math.sin(u * TWO_PI * lenPx + tt * px + ph)
          + bx * Math.cos(u * Math.PI * 3.3 * lenPx + tt * qx + ph * 1.3);
        let y = c.oy
          + ay * Math.cos(u * TWO_PI * lenPx + tt * py + ph * 0.7)
          + by * Math.sin(u * Math.PI * 3.7 * lenPx + tt * qy + ph * 1.7);
        x += W_012 * Math.sin(tt * rx + ph * 2.1);
        y += H_010 * Math.cos(tt * ry + ph * 2.9);
        pts.push(x, y); // Pack as flat array [x,y,x,y,...] for faster iteration
      }
      return pts;
    }

    function drawCurve(c, pts, tt) {
      const len = pts.length;
      if (len < 4) return;
      const pulse = 0.5 + 0.5 * Math.sin(tt * c.spd * 8 + c.ph);
      const alpha = c.alpha * (0.4 + 0.6 * pulse);

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (c.glowR) {
        ctx.lineWidth = c.width * 4;
        ctx.strokeStyle = GOLD + (alpha * 0.2).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (let k = 2; k < len; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
        ctx.stroke();
        ctx.lineWidth = c.width * 2;
      }

      const grd = ctx.createLinearGradient(pts[0], pts[1], pts[len - 2], pts[len - 1]);
      grd.addColorStop(0,    GOLD + (alpha * 0.05).toFixed(3) + ")");
      grd.addColorStop(0.25, GOLD + (alpha * 0.9 ).toFixed(3) + ")");
      grd.addColorStop(0.5,  PALE + (alpha * 1.0 ).toFixed(3) + ")");
      grd.addColorStop(0.75, GOLD + (alpha * 0.85).toFixed(3) + ")");
      grd.addColorStop(1,    GOLD + (alpha * 0.05).toFixed(3) + ")");

      ctx.strokeStyle = grd;
      ctx.lineWidth = c.width;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let k = 2; k < len; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
      ctx.stroke();
      ctx.restore();
    }

    function drawAmbient(tt) {
      const W = canvas.width, H = canvas.height;
      const pulse = 0.5 + 0.5 * Math.sin(tt * 0.018);
      const cx = W / 2, cy = H / 2;
      const rg = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy * 0.6, Math.max(W, H) * 0.55);
      rg.addColorStop(0,   GOLD + (0.12 + pulse * 0.08).toFixed(3) + ")");
      rg.addColorStop(0.4, GOLD + "0.04)");
      rg.addColorStop(1,   GOLD + "0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    let lastTime = 0;
    let rafId;

    function draw(now) {
      rafId = requestAnimationFrame(draw);
      // Frame rate limiting: chỉ vẽ mỗi ~33ms (~30fps) thay vì 60fps
      if (now - lastTime < 33) return;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAmbient(t);
      for (let i = 0; i < NUM; i++) {
        const pts = evalCurve(curves[i], t);
        drawCurve(curves[i], pts, t);
      }
      t += 1;
    }
    // Vẽ frame đầu synchronously để canvas xuất hiện ngay frame paint đầu tiên
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAmbient(t);
    for (let i = 0; i < NUM; i++) {
      const pts = evalCurve(curves[i], t);
      drawCurve(curves[i], pts, t);
    }
    t += 1;
    rafId = requestAnimationFrame(draw);
    // Báo cho parent là canvas đã sẵn sàng
    if (onReady) onReady();

    return () => {
      cancelAnimationFrame(rafId);
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
// Floating particles + sparkle — ported from HTML
// ──────────────────────────────────────────────────────────────────────────────
function FloatingParticles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mounted = true;

    function createParticle() {
      if (!mounted || !container) return;
      const d = document.createElement("div");
      const size = 1 + Math.random() * 2.5;
      d.className = "fp";
      d.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${Math.random() * 100}%`,
        `bottom:${Math.random() * 10}%`,
        `--d:${(8 + Math.random() * 10).toFixed(1)}s`,
        `--delay:-${(Math.random() * 15).toFixed(1)}s`,
      ].join(";");
      container.appendChild(d);
    }

    // Tạo particles từ từ để không block main thread
    const batchSize = 15;
    let created = 0;
    function createBatch() {
      if (!mounted) return;
      const end = Math.min(created + batchSize, 50); // Giảm từ 120 xuống 50
      while (created < end) {
        createParticle();
        created++;
      }
      if (created < 50) {
        requestAnimationFrame(createBatch);
      }
    }
    requestAnimationFrame(createBatch);

    // Giảm sparkle từ 200ms xuống 400ms
    const sparkInterval = setInterval(() => {
      if (!mounted || !container) return;
      const s = document.createElement("div");
      const size = 3 + Math.random() * 3;
      s.className = "fp-sparkle";
      s.style.cssText = [
        "position:absolute",
        `width:${size}px`,
        `height:${size}px`,
        "border-radius:50%",
        "background:#fff9e6",
        "pointer-events:none",
        `left:${15 + Math.random() * 70}%`,
        `top:${15 + Math.random() * 70}%`,
        "animation:sparkFade 0.6s ease-out forwards",
        "box-shadow:0 0 15px #c9952a,0 0 30px #fff",
        "z-index:2",
      ].join(";");
      container.appendChild(s);
      setTimeout(() => {
        if (s.parentNode) s.remove();
      }, 700);
    }, 400);

    return () => {
      mounted = false;
      clearInterval(sparkInterval);
      // Clean up particles on unmount
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Curtain — chỉ hiển thị SAU KHI login (trigger=true). Intro lúc mount không có.
// Animation giống intro ban đầu: flash → seam glow → logo zoom → 2 panels trượt
// ──────────────────────────────────────────────────────────────────────────────
function Curtain() {
  const [animKey] = useState(() => Date.now());

  useEffect(() => {
    const t = setTimeout(() => {
      const evt = new CustomEvent("curtain-done");
      window.dispatchEvent(evt);
    }, 3800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div key={animKey} style={curtainStylesObj.curtain}>
      {/* Flash overlay */}
      <div style={curtainStylesObj.flash} />

      {/* Two panels */}
      <div style={curtainStylesObj.left} />
      <div style={curtainStylesObj.right} />

      {/* Center seam glow */}
      <div style={curtainStylesObj.seam} />

      {/* Logo */}
      <div style={curtainStylesObj.logo}>
        <div style={curtainStylesObj.ring}>
          <div className="curtain-spin-ring-1" />
          <div className="curtain-spin-ring-2" />
          <img
            src={COMPANY_LOGO_URL}
            alt={COMPANY_DISPLAY_NAME}
            style={curtainStylesObj.img}
          />
        </div>
        <div style={curtainStylesObj.wordmark}>{COMPANY_DISPLAY_NAME}</div>
        <div style={curtainStylesObj.tagline}>{COMPANY_LEGAL_NAME}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// LogoutCurtain — animation ĐÓNG lại (panels trượt vào từ 2 bên, gặp nhau ở giữa)
// Dùng khi user đăng xuất. Không có flash, không có logo zoom.
// ──────────────────────────────────────────────────────────────────────────────
function LogoutCurtain({ onDone }) {
  const [animKey] = useState(() => Date.now());

  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div key={animKey} style={logoutCurtainStyles.curtain}>
      {/* Two panels slide IN from the sides, meeting in the middle */}
      <div style={logoutCurtainStyles.left} />
      <div style={logoutCurtainStyles.right} />
      {/* Center seam glow appears as panels meet */}
      <div style={logoutCurtainStyles.seam} />
      {/* Logo zooms in subtly to fill the closing frame */}
      <div style={logoutCurtainStyles.logo}>
        <div style={logoutCurtainStyles.ring}>
          <img
            src={COMPANY_LOGO_URL}
            alt={COMPANY_DISPLAY_NAME}
            style={logoutCurtainStyles.img}
          />
        </div>
        <div style={logoutCurtainStyles.wordmark}>{COMPANY_DISPLAY_NAME}</div>
        <div style={logoutCurtainStyles.tagline}>{COMPANY_LEGAL_NAME}</div>
      </div>
    </div>
  );
}

const logoutCurtainStyles = {
  curtain: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "#000",
    overflow: "hidden",
    pointerEvents: "none",
  },
  left: {
    position: "absolute",
    top: 0, bottom: 0, left: 0,
    width: "50%",
    background: "linear-gradient(to bottom,#0d0700,#1a0e00,#0d0700)",
    borderRight: "1px solid #c9952a44",
    transform: "translateX(-100%)",
    animation: "logoutSlideLeft 1.1s cubic-bezier(.77,0,.175,1) forwards",
  },
  right: {
    position: "absolute",
    top: 0, bottom: 0, right: 0,
    width: "50%",
    background: "linear-gradient(to bottom,#0d0700,#1a0e00,#0d0700)",
    borderLeft: "1px solid #c9952a44",
    transform: "translateX(100%)",
    animation: "logoutSlideRight 1.1s cubic-bezier(.77,0,.175,1) forwards",
  },
  seam: {
    position: "absolute",
    top: 0, bottom: 0, left: "50%",
    width: 2,
    background: "linear-gradient(to bottom,transparent,#fff9e6,#c9952a,#fff9e6,transparent)",
    transform: "translateX(-50%)",
    animation: "logoutSeamGlow 1.2s ease-out 0.95s forwards",
    opacity: 0,
  },
  logo: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%) scale(0.4)",
    opacity: 0,
    animation: "logoutLogoIn 0.9s cubic-bezier(.34,1.2,.64,1) 0.3s forwards",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 110, height: 110,
    borderRadius: "50%",
    border: "2px solid #c9952a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "#0a0600",
    boxShadow: "0 0 30px #c9952a66",
  },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  wordmark: {
    marginTop: 18,
    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: 4,
    color: "#f5d78e",
    textShadow: "0 0 12px #c9952aaa, 0 0 4px #fff9e6",
    textAlign: "center",
    width: 260,
    transform: "none",
    position: "relative",
    left: "auto",
    top: "auto",
  },
  tagline: {
    marginTop: 6,
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    letterSpacing: 3,
    color: "#a07a3acc",
    textTransform: "uppercase",
    textAlign: "center",
    width: 260,
    transform: "none",
    position: "relative",
    left: "auto",
    top: "auto",
  },
};

const curtainStylesObj = {
  curtain: {
    position: "absolute",
    inset: 0,
    zIndex: 9998,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    animation: "curtainFade 0.6s ease-out 3.2s forwards",
  },
  flash: {
    position: "absolute",
    inset: 0,
    zIndex: 9999,
    background: "white",
    opacity: 0,
    pointerEvents: "none",
    animation: "flash 0.6s ease-out 2.9s forwards",
  },
  left: {
    position: "absolute",
    top: 0, bottom: 0, left: 0,
    width: "50%",
    background: "linear-gradient(to bottom,#0d0700,#1a0e00,#0d0700)",
    borderRight: "1px solid #c9952a44",
    animation: "slideLeft 1.2s cubic-bezier(.77,0,.175,1) 1.6s forwards",
  },
  right: {
    position: "absolute",
    top: 0, bottom: 0, right: 0,
    width: "50%",
    background: "linear-gradient(to bottom,#0d0700,#1a0e00,#0d0700)",
    borderLeft: "1px solid #c9952a44",
    animation: "slideRight 1.2s cubic-bezier(.77,0,.175,1) 1.6s forwards",
  },
  seam: {
    position: "absolute",
    top: 0, bottom: 0, left: "50%",
    width: 2,
    background: "linear-gradient(to bottom,transparent,#fff9e6,#c9952a,#fff9e6,transparent)",
    transform: "translateX(-50%)",
    animation: "seamGlow 1.5s ease-out 1s forwards",
    opacity: 0,
  },
  logo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    animation: "logoZoom 0.9s cubic-bezier(.34,1.56,.64,1) 0.3s both",
    zIndex: 1,
    position: "relative",
  },
  ring: {
    width: 130, height: 130,
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
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  wordmark: {
    color: "#c9952a",
    fontSize: 28,
    letterSpacing: 10,
    fontWeight: "bold",
    textShadow: "0 0 30px #c9952a,0 0 60px #c9952a55",
    animation: "wordmarkFlicker 0.1s linear 0.8s 3",
  },
  tagline: {
    color: "#c9952a77",
    fontSize: 10,
    letterSpacing: 5,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Corner ornament
// ──────────────────────────────────────────────────────────────────────────────
function Orn({ pos }) {
  const transforms = {
    tl: undefined,
    tr: "scaleX(-1)",
    bl: "scaleY(-1)",
    br: "scale(-1,-1)",
  };
  const positions = {
    tl: { top: 10, left: 10 },
    tr: { top: 10, right: 10 },
    bl: { bottom: 10, left: 10 },
    br: { bottom: 10, right: 10 },
  };
  return (
    <div style={{ position: "absolute", width: 20, height: 20, ...positions[pos] }}>
      <svg
        viewBox="0 0 20 20"
        width="20"
        height="20"
        style={{ transform: transforms[pos] }}
      >
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="#f5d78e" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="2" fill="#f5d78e" />
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main LoginPage
// ──────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [showCurtain, setShowCurtain] = useState(false);
  // Logout intro: flag này được set bởi handleLogout ở layout.tsx trước khi
  // redirect tới /login. LoginPage sẽ hiển thị LogoutCurtain 1.4s trước khi
  // hiện form, rồi mới unmount curtain để reveal login card.
  const [logoutPlaying, setLogoutPlaying] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("logout-curtain") === "1";
    }
    return false;
  });
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (logoutPlaying) {
      // Clear flag để lần sau vào /login bình thường (không chạy lại curtain)
      sessionStorage.removeItem("logout-curtain");
    }
  }, [logoutPlaying]);

  const navigateWithCurtain = (path) => {
    setShowCurtain(true);
    setLoading(false);
    // router.replace thay vì push — login không còn trong history
    // Push sớm ngay sau khi flash (2.9s) để trang đích load song song,
    // curtain vẫn cover mượt cho tới khi xong ở 3.8s
    setTimeout(() => router.replace(path), 2800);
  };

  // ── Original logic — UNCHANGED ─────────────────────────────────────────────
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/login", values);
      const user = data.data;
      dispatch(setCurrentUser(user));
      message.success("Đăng nhập thành công");

      const { position, quocgia = "kr" } = user;
      const isSale = ["salefull", "salexuly", "salenhapdon"].includes(position);

      // Sale (Online/Xử lý/Nhập đơn) → trang quản lý đơn hàng theo quốc gia
      if (isSale) {
        if (quocgia === "jp") {
          navigateWithCurtain("/ordersjp");
          return;
        }
        if (quocgia === "tw") {
          navigateWithCurtain("/orderstw");
          return;
        }
        navigateWithCurtain("/orders");
        return;
      }
 if (name === "Trần Hằng Nga") {
        navigateWithCurtain("/orders2");
        return;
      }
 
      if (["lead", "leadSALE", "managerMKT", "managersale", "managerSALE"].includes(position)) {
        navigateWithCurtain("/");
        return;
      }
      if (["admin"].includes(position)) {
        navigateWithCurtain("/overviewall");
        return;
      }
      if (quocgia === "jp") {
        navigateWithCurtain("/ordersjp");
        return;
      }
      if (position === "kho2" && quocgia === "kr") {
        navigateWithCurtain("/orderkhohanh");
        return;
      }
      if (position === "kho2") {
        navigateWithCurtain("/orderkho");
        return;
      }
      if (position === "kho1") {
        navigateWithCurtain("/orders2");
        return;
      }
      if (position === "khomalay2") {
        navigateWithCurtain("/orderkhomalay");
        return;
      }
      if (quocgia === "tw") {
        navigateWithCurtain("/orderstw");
        return;
      }
      navigateWithCurtain("/orders");
    } catch (error) {
      message.error(
        error?.response?.data?.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại!"
      );
    } finally {
      setLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      {/* Radial dark-gold background */}
      <div style={styles.bg} />

      {/* Bright golden overlay glow */}
      <div style={styles.bgOverlay} />

      {/* Animated golden curves canvas */}
      <GoldenCanvas onReady={() => setCanvasReady(true)} />

      {/* Floating particles + sparkles */}
      <FloatingParticles />

      {/* ── Login card ── */}
      {canvasReady && !showCurtain && (
      <div style={styles.cardWrap}>
        {/* Aura glow behind card */}
        <div style={styles.aura} />
        {/* Beam below card */}
        <div style={styles.beam} />

        <div style={styles.card}>
          {/* Top line accent */}
          <div style={styles.cardTopLine} />
          {/* Radial inner glow */}
          <div style={styles.cardInnerGlow} />

          {/* Corner ornaments */}
          <Orn pos="tl" />
          <Orn pos="tr" />
          <Orn pos="bl" />
          <Orn pos="br" />

          {/* Header: logo + brand */}
          <div style={styles.hdr}>
            <div style={styles.logoOuter}>
              {/* Spinning decorative ring */}
              <div className="logo-spin-ring" />
              <img
                src={COMPANY_LOGO_URL}
                alt={COMPANY_DISPLAY_NAME}
                style={styles.logoImg}
              />
            </div>
            <div style={styles.brand}>{COMPANY_DISPLAY_NAME}</div>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLineL} />
            <span style={styles.dividerIcon}>◆ ✦ ◆</span>
            <div style={styles.dividerLineR} />
          </div>

          {/* Form — Ant Design, keeps original field names & validation */}
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={<span style={styles.flabel}>Tài Khoản</span>}
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
            >
              <Input
                placeholder="Nhập tài khoản"
                className="gold-input"
                style={styles.finput}
              />
            </Form.Item>

            <Form.Item
              label={<span style={styles.flabel}>Mật Khẩu</span>}
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu"
                className="gold-input"
                style={{ ...styles.finput, paddingRight: 42 }}
              />
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
      )}

      {/* ── Curtain animation: only renders after login (trigger=true) ── */}
      {showCurtain && <Curtain trigger={showCurtain} />}

      {/* All keyframes + overrides */}
      <style>{globalCSS}</style>

      {/* ── Logout intro curtain ── covers the screen briefly when user logged out ── */}
      {logoutPlaying && (
        <LogoutCurtain
          onDone={() => setLogoutPlaying(false)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles (inline)
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
    background: "radial-gradient(ellipse at 50% 0%,#2a1a00 0%,#140d00 40%,#000 100%)",
    zIndex: 0,
  },
  bgOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    background:
      "radial-gradient(ellipse at 50% 50%,rgba(255,215,0,0.35) 0%,rgba(255,215,0,0.08) 50%,transparent 70%)",
    pointerEvents: "none",
  },
  // ── Card wrapper ──
  cardWrap: {
    position: "relative",
    zIndex: 60, // Cao hơn curtain (zIndex 50) để form hiện phía trên
    width: 400,
    maxWidth: "92%",
  },
  aura: {
    position: "absolute",
    inset: -80,
    borderRadius: 100,
    background: "radial-gradient(ellipse,rgba(255,215,0,0.6) 0%,transparent 60%)",
    filter: "blur(50px)",
    animation: "auraPulse 5s ease-in-out infinite",
    pointerEvents: "none",
    zIndex: -1,
  },
  beam: {
    position: "absolute",
    bottom: "-120%",
    left: "10%",
    width: "80%",
    height: "80%",
    background: "radial-gradient(ellipse at center,rgba(255,215,0,0.6) 0%,transparent 70%)",
    filter: "blur(70px)",
    pointerEvents: "none",
    animation: "beamPulse 6s ease-in-out infinite",
    zIndex: -2,
  },
  // ── Card ──
  card: {
    background: "linear-gradient(160deg,#3a2000 0%,#201300 50%,#3a2000 100%)",
    borderRadius: 20,
    border: "1px solid rgba(245,215,142,0.8)",
    padding: "40px 36px 36px",
    position: "relative",
    overflow: "hidden",
    boxShadow:
      "0 0 80px rgba(255,215,0,0.5), 0 0 200px rgba(255,215,0,0.25), 0 0 300px rgba(255,215,0,0.12), inset 0 0 40px rgba(255,215,0,0.05)",
    backdropFilter: "blur(4px)",
  },
  cardTopLine: {
    position: "absolute",
    top: 0,
    left: "15%",
    right: "15%",
    height: 1,
    background:
      "linear-gradient(to right,transparent,#fff9e6,#c9952a,#fff9e6,transparent)",
  },
  cardInnerGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    background:
      "radial-gradient(ellipse at 50% -5%,#c9952a1a 0%,transparent 55%)",
    pointerEvents: "none",
  },
  // ── Header ──
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
    border: "1.5px solid rgba(245,215,142,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 14,
    animation: "logoGlow 4s ease-in-out infinite",
    overflow: "hidden",
    background: "#000",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "#000",
  },
  brand: {
    color: "#f5d78e",
    fontSize: 17,
    letterSpacing: 7,
    fontWeight: "bold",
  },
  // ── Divider ──
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "20px 0 24px",
  },
  dividerLineL: {
    flex: 1,
    height: 1,
    background: "linear-gradient(to right,transparent,#c9952a55)",
  },
  dividerLineR: {
    flex: 1,
    height: 1,
    background: "linear-gradient(to left,transparent,#c9952a55)",
  },
  dividerIcon: {
    color: "#c9952a",
    fontSize: 12,
  },
  // ── Form ──
  flabel: {
    display: "block",
    color: "#f5d78ecc",
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
    marginBottom: 7,
    paddingLeft: 2,
  },
  finput: {
    width: "100%",
    background: "#1a0f00",
    border: "1px solid rgba(245,215,142,0.5)",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#fff9e6",
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
    background:
      "linear-gradient(90deg,#c9952a,#f5d78e,#c9952a,#f5d78e,#c9952a)",
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
    boxShadow: "0 0 40px rgba(255,215,0,0.6)",
    animation: "btnShimmer 3s linear infinite",
  },
  seal: {
    textAlign: "center",
    marginTop: 22,
    color: "#c9952a55",
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
};

const curtainPanelStyle = {
  position: "absolute",
  top: 0,
  width: "50%",
  height: "100%",
  background: "linear-gradient(90deg, #d4a017 0%, #f5d76e 50%, #b8860b 100%)",
  zIndex: 9999,
  pointerEvents: "none",
  boxShadow: "0 0 40px rgba(212,160,23,0.6), inset 0 0 80px rgba(255,235,140,0.3)",
};

const centerLogoStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 10000,
  textAlign: "center",
  pointerEvents: "none",
  animation: "logoFadeIn 0.9s ease forwards",
};

const globalCSS = `
  /* ── Keyframes ── */
  @keyframes curtainLeft {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
  @keyframes curtainRight {
    0%   { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }
  @keyframes logoFadeIn {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
    30%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes auraPulse {
    0%,100% { opacity:0.8; transform:scale(1);   }
    50%     { opacity:1;   transform:scale(1.1); }
  }
  @keyframes beamPulse {
    0%,100% { opacity:0.6; transform:scale(1) translateY(0);    }
    50%     { opacity:1;   transform:scale(1.15) translateY(15%); }
  }
  @keyframes logoGlow {
    0%,100% { box-shadow:0 0 15px #c9952a55; }
    50%     { box-shadow:0 0 35px #c9952a99, 0 0 60px #c9952a44; }
  }
  @keyframes btnShimmer {
    0%   { background-position:200% 0;  }
    100% { background-position:-200% 0; }
  }

  /* ── Curtain keyframes (after-login exit) ── */
  @keyframes curtainFade   { to { opacity:0; pointer-events:none; } }
  @keyframes flash {
    0%   { opacity:1; filter:blur(10px); box-shadow:inset 0 0 400px #fff; }
    100% { opacity:0; filter:blur(30px); }
  }
  @keyframes slideLeft  { to { transform:translateX(-100%); } }
  @keyframes slideRight { to { transform:translateX(100%);  } }
  @keyframes seamGlow {
    0%   { opacity:0; }
    30%  { opacity:1; box-shadow:0 0 20px 4px #c9952a; }
    70%  { opacity:1; box-shadow:0 0 30px 8px #fff9e6; }
    100% { opacity:0; }
  }
  @keyframes logoZoom {
    from { opacity:0; transform:scale(0.5); }
    to   { opacity:1; transform:scale(1);   }
  }
  @keyframes ringPulse {
    0%,100% { box-shadow:0 0 0 0 #c9952a00, 0 0 20px #c9952a55; }
    50%     { box-shadow:0 0 0 10px #c9952a22, 0 0 50px #c9952a99; }
  }
  @keyframes wordmarkFlicker { 50% { opacity:0.6; } }

  /* ── Logout curtain keyframes (panels slide IN from the sides) ── */
  @keyframes logoutSlideLeft  { to { transform: translateX(0); } }
  @keyframes logoutSlideRight { to { transform: translateX(0); } }
  @keyframes logoutSeamGlow {
    0%   { opacity: 0; }
    50%  { opacity: 1; box-shadow: 0 0 30px 6px #c9952a; }
    100% { opacity: 1; box-shadow: 0 0 50px 12px #fff9e6; }
  }
  @keyframes logoutLogoIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1);   }
  }

  /* Spinning ring inside card logo */
  .logo-spin-ring {
    position:absolute;
    inset:-6px;
    border-radius:50%;
    border:1px solid #c9952a44;
    animation:spinRing 10s linear infinite;
    z-index:2;
    pointer-events:none;
  }
  @keyframes spinRing { to { transform:rotate(360deg); } }

  /* ── Floating particles ── */
  .fp {
    position:absolute;
    border-radius:50%;
    background:#fff9e6;
    pointer-events:none;
    box-shadow:0 0 8px #c9952a;
    animation:floatUp var(--d) ease-in infinite var(--delay);
    opacity:0;
  }
  @keyframes floatUp {
    0%   { opacity:0; transform:translateY(0) scale(0.5); }
    10%  { opacity:1; transform:scale(1.2); }
    80%  { opacity:0.8; }
    100% { opacity:0; transform:translateY(-120vh) scale(0.3); }
  }
  @keyframes sparkFade {
    0%   { opacity:1; transform:scale(1); }
    100% { opacity:0; transform:scale(2); }
  }

  /* ── Ant Design overrides ── */
  .gold-input .ant-input,
  .gold-input {
    background:#120900 !important;
    border:1px solid #c9952a44 !important;
    border-radius:8px !important;
    color:#f0d890 !important;
    caret-color:#c9952a !important;
  }
  .gold-input .ant-input:focus,
  .gold-input:focus {
    border-color:#f5d78e !important;
    box-shadow:0 0 25px rgba(255,215,0,0.3), inset 0 0 15px rgba(255,215,0,0.1) !important;
    background:#2a1800 !important;
  }
  .gold-input .ant-input::placeholder,
  .gold-input::placeholder { color:#c9952a55 !important; }

  .ant-input-affix-wrapper.gold-input {
    background:#120900 !important;
    border:1px solid #c9952a44 !important;
    border-radius:8px !important;
    padding:0 !important;
  }
  .ant-input-affix-wrapper.gold-input input.ant-input {
    border:none !important;
    box-shadow:none !important;
    background:transparent !important;
    padding:12px 16px !important;
  }
  .ant-input-affix-wrapper.gold-input:focus-within {
    border-color:#f5d78e !important;
    box-shadow:0 0 25px rgba(255,215,0,0.3) !important;
  }
  .ant-input-affix-wrapper.gold-input .ant-input-suffix svg,
  .ant-input-affix-wrapper.gold-input .ant-input-password-icon {
    color:#c9952a66 !important;
  }
  .ant-input-affix-wrapper.gold-input .ant-input-password-icon:hover {
    color:#c9952a !important;
  }
  .ant-form-item-label label { color:#c9952a99 !important; }
  .ant-form-item-explain-error { color:#e08840 !important; font-size:11px; }

  .gold-btn.ant-btn,
  .gold-btn.ant-btn:not(:disabled) {
    background:linear-gradient(90deg,#c9952a,#f5d78e,#c9952a,#f5d78e,#c9952a) !important;
    background-size:300% 100% !important;
    border:none !important;
    color:#0a0500 !important;
    animation:btnShimmer 3s linear infinite !important;
    box-shadow:0 0 40px rgba(255,215,0,0.6) !important;
  }
  .gold-btn.ant-btn::after {
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(to bottom,rgba(255,255,255,0.3) 0%,transparent 60%);
    border-radius:8px;
    pointer-events:none;
  }
  .gold-btn.ant-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:0 0 60px rgba(255,215,0,0.8) !important;
    opacity:1 !important;
  }
  .gold-btn.ant-btn:active { transform:scale(0.98); }

  /* ── Curtain spinning rings ── */
  .curtain-spin-ring-1 {
    content:'';
    position:absolute;
    inset:-10px;
    border-radius:50%;
    border:1px solid #c9952a44;
    animation:spinRing 7s linear infinite;
    z-index:10;
    pointer-events:none;
  }
  .curtain-spin-ring-2 {
    content:'';
    position:absolute;
    inset:-20px;
    border-radius:50%;
    border:1px dashed #c9952a22;
    animation:spinRing 13s linear infinite reverse;
    z-index:10;
    pointer-events:none;
  }

  @media (max-width:480px) {
    div[style*="width: 400px"] { width:calc(100% - 32px) !important; max-width:400px !important; }
  }
`;
