"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

/* ============================================================
   TAB "TÀI KHOẢN"
   Nguồn logic gốc: src/app/accounts/page.js (bản admin quản lý toàn bộ NV)
   -> Mockup lại là trang HỒ SƠ CÁ NHÂN (tự đổi mật khẩu, tự quản lý STK
      ngân hàng của chính mình) — đây là chức năng MỚI, viết thêm:
   API dùng:
   - POST /api/employees/change-password   (MỚI — xem file kèm theo)
   - PUT  /api/employees/[employee_id]     (có sẵn) — dùng để lưu mảng
     bankAccounts: [{bank, number, name}] vào employee hiện tại.
   Field cũ `stk`, `nh` trên Employee (số tài khoản/ngân hàng đơn) được
   giữ lại và tự động gộp vào danh sách hiển thị nếu bankAccounts rỗng.
   ============================================================ */

const BANKS = [
  "Vietcombank", "BIDV", "Techcombank", "MB Bank", "VPBank", "Agribank",
  "ACB", "VietinBank", "TPBank", "Sacombank", "SHB", "HDBank",
];

function initials(name) {
  return name
    ? name.trim().split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "??";
}

export default function TaiKhoanTab() {
  const currentUser = useSelector((state) => state.user.currentUser) || {};

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [bank, setBank] = useState("");
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [stkMsg, setStkMsg] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser.employee_id) return;
      setLoadingProfile(true);
      try {
        const res = await axios.get("/api/employees");
        const me = (res.data.data || []).find(
          (e) => e.employee_id === currentUser.employee_id
        );
        if (me) {
          if (Array.isArray(me.bankAccounts) && me.bankAccounts.length > 0) {
            setBankAccounts(me.bankAccounts);
          } else if (me.stk) {
            setBankAccounts([{ bank: me.nh || "", number: me.stk, name: me.name || "" }]);
          }
        }
      } catch (e) {
        console.error("Lỗi tải hồ sơ:", e);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [currentUser.employee_id]);

  const pwStrength = (v) => {
    if (!v) return { label: "", color: "" };
    if (v.length < 6) return { label: "Quá ngắn", color: "var(--red)" };
    if (v.length < 9) return { label: "Trung bình", color: "var(--orange)" };
    return { label: "Mạnh", color: "var(--green)" };
  };
  const strength = pwStrength(pwNew);

  const changePw = async () => {
    setPwMsg(null);
    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwMsg({ ok: false, text: "Vui lòng nhập đầy đủ thông tin." });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg({ ok: false, text: "Mật khẩu mới xác nhận không khớp." });
      return;
    }
    if (pwNew.length < 6) {
      setPwMsg({ ok: false, text: "Mật khẩu mới phải từ 6 ký tự." });
      return;
    }
    setPwSaving(true);
    try {
      await axios.post("/api/employees/change-password", {
        employee_id: currentUser.employee_id,
        currentPassword: pwCurrent,
        newPassword: pwNew,
      });
      setPwMsg({ ok: true, text: "✅ Đổi mật khẩu thành công!" });
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (e) {
      setPwMsg({
        ok: false,
        text: e.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setPwSaving(false);
    }
  };

  const saveBankAccounts = async (next) => {
    try {
      await axios.put(`/api/employees/${currentUser.employee_id}`, {
        bankAccounts: next,
      });
      setBankAccounts(next);
    } catch (e) {
      console.error("Lỗi lưu STK:", e);
      setStkMsg({ ok: false, text: "Không lưu được, vui lòng thử lại." });
    }
  };

  const addSTK = async () => {
    setStkMsg(null);
    if (!bank || !number.trim() || !holderName.trim()) {
      setStkMsg({ ok: false, text: "Vui lòng nhập đầy đủ thông tin tài khoản." });
      return;
    }
    const next = [...bankAccounts, { bank, number: number.trim(), name: holderName.trim() }];
    await saveBankAccounts(next);
    setBank("");
    setNumber("");
    setHolderName("");
    setStkMsg({ ok: true, text: "✅ Đã thêm tài khoản ngân hàng." });
  };

  const removeSTK = async (idx) => {
    const next = bankAccounts.filter((_, i) => i !== idx);
    await saveBankAccounts(next);
  };

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg,#1e2640,#141929)",
          borderRadius: 12,
          padding: 18,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "linear-gradient(135deg,var(--gold),#c07818)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials(currentUser.name)}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
            {currentUser.name || "—"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            {currentUser.position_team || "MKT"} · Hàn Quốc
          </div>
          <div style={{ fontSize: 11, color: "var(--gold-light)", marginTop: 4 }}>
            @{(currentUser.username || "").toLowerCase() || "—"}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          🔒 Đổi mật khẩu
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--sub)",
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 5,
              }}
            >
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                background: "#fff",
                minHeight: 44,
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--sub)",
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 5,
              }}
            >
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="Tối thiểu 6 ký tự..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                background: "#fff",
                minHeight: 44,
              }}
            />
            <div style={{ marginTop: 5, fontSize: 11, height: 14, color: strength.color }}>
              {strength.label}
            </div>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--sub)",
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 5,
              }}
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                background: "#fff",
                minHeight: 44,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={changePw}
              disabled={pwSaving}
              className="btn btn-save"
              style={{ padding: "10px 24px", fontSize: 14, minHeight: 44 }}
            >
              💾 {pwSaving ? "Đang lưu..." : "Lưu mật khẩu"}
            </button>
            {pwMsg && (
              <div
                style={{
                  fontSize: 12,
                  color: pwMsg.ok ? "var(--green)" : "var(--red)",
                }}
              >
                {pwMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          🏦 Số tài khoản ngân hàng
        </div>
        <div style={{ marginBottom: 14 }}>
          {loadingProfile && (
            <div style={{ fontSize: 12, color: "var(--light)" }}>Đang tải...</div>
          )}
          {!loadingProfile && bankAccounts.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--light)" }}>
              Chưa có tài khoản ngân hàng nào.
            </div>
          )}
          {bankAccounts.map((acc, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{acc.bank}</div>
                <div style={{ fontSize: 12, color: "var(--sub)" }}>
                  {acc.number} · {acc.name}
                </div>
              </div>
              <button
                className="btn btn-del"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => removeSTK(idx)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
        <div
          style={{
            background: "var(--bg)",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sub)", marginBottom: 12 }}>
            + Thêm tài khoản ngân hàng
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              maxWidth: 500,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--sub)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Ngân hàng
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                  minHeight: 42,
                }}
              >
                <option value="">Chọn ngân hàng...</option>
                {BANKS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--sub)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Số tài khoản
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Nhập số tài khoản..."
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                  minHeight: 42,
                }}
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--sub)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Tên chủ tài khoản
              </label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN QUOC HIEU"
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                  minHeight: 42,
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={addSTK}
              className="btn btn-add"
              style={{ padding: "9px 20px", fontSize: 13, minHeight: 42 }}
            >
              + Thêm tài khoản
            </button>
            {stkMsg && (
              <div
                style={{
                  fontSize: 12,
                  color: stkMsg.ok ? "var(--green)" : "var(--red)",
                }}
              >
                {stkMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
