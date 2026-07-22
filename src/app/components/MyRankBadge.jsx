"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const MEDAL = ["🥇", "🥈", "🥉"];

const pick = (res) => {
  if (!res || !res.data) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data.data)) return res.data.data;
  return [];
};

const fmt = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}Tr`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(0)}K`
    : `${n}đ`;

export default function MyRankBadge() {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [rank, setRank] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mySales, setMySales] = useState(0);
  const [myOrders, setMyOrders] = useState(0);
  // mode: "rank" (mặc định) hoặc "sales" (sau khi click)
  const [mode, setMode] = useState("rank");

  useEffect(() => {
    let cancelled = false;
    const myName = (currentUser?.name || "").trim().toLowerCase();
    if (!myName) return;

    const compute = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, "0")}-01`;
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`;

        const [ordersKR, ordersJP, ordersTW, recordsKR, recordsJP, recordsTW, empRes] =
          await Promise.all([
            axios.get(`/api/orders2?selectedDate=${today}`).catch(() => ({ data: [] })),
            axios.get(`/api/jp/orders2?selectedDate=${today}`).catch(() => ({ data: [] })),
            axios.get(`/api/tw/orders2?selectedDate=${today}`).catch(() => ({ data: [] })),
            axios.get(`/api/recordsMKT?start=${startStr}&end=${endStr}`).catch(() => ({ data: [] })),
            axios.get(`/api/jp/recordsMKT?start=${startStr}&end=${endStr}`).catch(() => ({ data: [] })),
            axios.get(`/api/tw/recordsMKT?start=${startStr}&end=${endStr}`).catch(() => ({ data: [] })),
            axios.get(`/api/employees`).catch(() => ({ data: [] })),
          ]);

        const orders = [...pick(ordersKR), ...pick(ordersJP), ...pick(ordersTW)];
        const records = [...pick(recordsKR), ...pick(recordsJP), ...pick(recordsTW)];
        const employees = pick(empRes);

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const totalByNameToday = {};
        const ordersByNameToday = {};
        for (const order of orders) {
          const orderDate = new Date(order.createdAt);
          if (orderDate < startOfToday || orderDate >= endOfToday) continue;
          const mkt = (order.mkt || "").trim().toLowerCase();
          if (!mkt) continue;
          totalByNameToday[mkt] = (totalByNameToday[mkt] || 0) + Number(order.profit || 0);
          ordersByNameToday[mkt] = (ordersByNameToday[mkt] || 0) + 1;
        }

        const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        const endOfDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const adsByNameThisMonth = {};
        for (const ad of records) {
          const adDate = new Date(ad.createdAt);
          const name = (ad.name || "").trim().toLowerCase();
          if (!name) continue;
          if (adDate < twoDaysAgo || adDate > endOfDay) continue;
          const v = Number(ad.request1 || 0) + Number(ad.request2 || 0);
          adsByNameThisMonth[name] = (adsByNameThisMonth[name] || 0) + v;
        }

        const excludedNames2 = ["quách phú"];
        const ranked = employees
          .filter((e) => {
            const lc = (e.name || "").trim().toLowerCase();
            const ads = adsByNameThisMonth[lc] || 0;
            const isMkt = (e.position_team || "").toLowerCase() === "mkt";
            return isMkt && ads > 0 && !excludedNames2.includes(lc);
          })
          .map((e) => ({
            name: (e.name || "").trim().toLowerCase(),
            totalToday: totalByNameToday[(e.name || "").trim().toLowerCase()] || 0,
          }))
          .sort((a, b) => b.totalToday - a.totalToday);

        if (cancelled) return;
        setTotal(ranked.length);
        const idx = ranked.findIndex((r) => r.name === myName);
        setRank(idx >= 0 ? idx + 1 : null);
        setMySales((totalByNameToday[myName] || 0) * 17000);
        setMyOrders(ordersByNameToday[myName] || 0);
      } catch {
        if (!cancelled) {
          setRank(null);
          setMySales(0);
          setMyOrders(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(compute, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentUser?.name]);

  if (!currentUser?.name) return null;
  if (!loading && (!rank || rank > 15)) return null;

  // ===== Build nhãn hiển thị =====
  let label = "—";
  let tone = "";

  if (mode === "sales") {
    // Đang hiện doanh số: hiển thị số đơn + doanh thu hôm nay
    if (loading) {
      label = "…";
    } else {
      label = `${fmt(mySales)} · ${myOrders} đơn`;
    }
    tone = "rank-sales";
  } else {
    // Mặc định: ưu tiên hiển thị trong top 10, cảnh báo top 11-15, ngoài ra ẩn số hạng
    if (loading) {
      label = "…";
    } else if (rank && rank <= 3) {
      label = `${MEDAL[rank - 1]} TOP ${rank}`;
      tone = `rank-top rank-${rank}`;
    } else if (rank && rank <= 10) {
      label = `TOP ${rank}`;
      tone = "rank-mid";
    } else if (rank && rank <= 15) {
      label = "Sắp vào top 10";
      tone = "rank-mid";
    }
  }

  const tipText =
    mode === "sales"
      ? `Hạng ${rank || "—"}/${total}. Click để xem hạng.`
      : rank && rank <= 10
        ? `Hạng ${rank}/${total}. Click để xem doanh số hiện tại.`
        : rank && rank <= 15
          ? `Hạng ${rank}/${total}. Sắp vào top 10. Click để xem doanh số hiện tại.`
          : `Ngoài top 15. Click để xem doanh số hiện tại.`;

  return (
    <div
      className={`tb-rank-btn ${tone}`}
      style={{ cursor: "pointer" }}
      onClick={() => setMode((m) => (m === "rank" ? "sales" : "rank"))}
      title={tipText}
    >
      {label}
    </div>
  );
}