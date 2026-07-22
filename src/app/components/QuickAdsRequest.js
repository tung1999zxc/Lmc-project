"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Input, Button, Radio, message } from "antd";
import axios from "axios";

const QuickAdsRequest = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [amount, setAmount] = useState("");
  const [session, setSession] = useState("sang");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      message.warning("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/recordsMKT/quick-ads", {
        userId: currentUser.employee_code,
        name: currentUser.name,
        sang: session === "sang" ? parseInt(amount) : 0,
        chieu: session === "chieu" ? parseInt(amount) : 0,
        teamnv: currentUser.team_id,
        stk: currentUser.stk,
        nh: currentUser.nh,
      });

      message.success(response.data.message);
      setAmount("");
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xin ads nhanh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ 
        fontSize: "11px", 
        color: "rgba(255,255,255,0.7)", 
        marginBottom: 8,
        textTransform: "uppercase",
        fontWeight: 600
      }}>
        Xin Ads Nhanh
      </div>
      <Input
        type="number"
        placeholder="Số tiền..."
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ marginBottom: 8 }}
        size="small"
      />
      <Radio.Group 
        value={session} 
        onChange={(e) => setSession(e.target.value)}
        style={{ display: "flex", gap: 4, marginBottom: 8 }}
        size="small"
      >
        <Radio.Button value="sang" style={{ flex: 1, textAlign: "center" }}>☀️ Sáng</Radio.Button>
        <Radio.Button value="chieu" style={{ flex: 1, textAlign: "center" }}>🌙 Chiều</Radio.Button>
      </Radio.Group>
      <Button
        type="primary"
        size="small"
        block
        loading={loading}
        onClick={handleSubmit}
        style={{ background: "#c9952a" }}
      >
        Xin Ngay
      </Button>
    </div>
  );
};

export default QuickAdsRequest;
