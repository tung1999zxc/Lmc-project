"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

/* ============================================================
   TAB "BÁO CÁO MKT"
   Nguồn logic gốc: src/app/mkt/page.js
   API dùng: GET/POST /api/recordsMKT, PUT/DELETE /api/recordsMKT/[id],
             GET /api/orders (để tính Doanh số theo ngày cho MKT hiện tại)
   Field thật (collection "recordsMKT"): id, date, name, userId, oldMoney,
   request1 (Xin buổi sáng), request2 (Xin buổi chiều), totalReceived
   (Tổng tiền đã tiêu), excessMoney (Tiền dư), isLocked
   ------------------------------------------------------------
   MỤC CHƯA CÓ SẴN — ĐÃ BỔ SUNG:
   - Cột "Xin gấp" (mockup có nhưng field gốc không có) -> field mới
     `requestUrgent`. Đã cập nhật kèm file api/recordsMKT/route.js (POST)
     để lưu field này — nhớ chép đè file đó vào dự án.
   ============================================================ */

const EXCHANGE_RATE = 17000;

function fmtVND(n) {
  return (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫";
}

export default function BaoCaoMktTab() {
  const currentUser = useSelector((state) => state.user.currentUser) || {};
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0); // 0 = tháng này, -1 = tháng trước
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newDate, setNewDate] = useState(now.toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const rangeStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/recordsMKT", {
        params: { start: fmt(rangeStart), end: fmt(rangeEnd) },
      });
      const mine = (res.data.data || []).filter(
        (r) => r.name === currentUser.name
      );
      setRecords(mine);
    } catch (e) {
      console.error("Lỗi tải báo cáo MKT:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders", {
        params: { startDate: fmt(rangeStart), endDate: fmt(rangeEnd) },
      });
      setOrders(
        (res.data.data || []).filter(
          (o) =>
            o.mkt &&
            currentUser.name &&
            o.mkt.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
        )
      );
    } catch (e) {
      console.error("Lỗi tải đơn hàng cho báo cáo MKT:", e);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset, currentUser.name]);

  // Doanh số theo từng ngày (để tính %ADS)
  const revenueByDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const d = (o.orderDate || "").slice(0, 10);
      map[d] = (map[d] || 0) + (Number(o.profit) || 0) * EXCHANGE_RATE;
    });
    return map;
  }, [orders]);

  const totals = useMemo(() => {
    const totalDoanhSo = Object.values(revenueByDay).reduce((s, v) => s + v, 0);
    const totalXin = records.reduce(
      (s, r) => s + (r.request1 || 0) + (r.request2 || 0) + (r.requestUrgent || 0),
      0
    );
    const totalTieu = records.reduce((s, r) => s + (r.totalReceived || 0), 0);
    const tienThua = records.reduce((s, r) => s + (r.excessMoney || 0), 0);
    return {
      totalDoanhSo,
      totalXin,
      totalTieu,
      tienThua,
      percentXin: totalDoanhSo > 0 ? (totalXin / totalDoanhSo) * 100 : 0,
      percentTieu: totalDoanhSo > 0 ? (totalTieu / totalDoanhSo) * 100 : 0,
    };
  }, [records, revenueByDay]);

  const addRow = async () => {
    if (records.some((r) => r.date === newDate)) {
      window.alert("Ngày này đã có báo cáo!");
      return;
    }
    const payload = {
      id: Date.now(),
      date: newDate,
      name: currentUser.name,
      userId: currentUser.employee_id,
      oldMoney: 0,
      request1: 0,
      request2: 0,
      requestUrgent: 0,
      totalReceived: 0,
      excessMoney: 0,
      isLocked: false,
    };
    try {
      await axios.post("/api/recordsMKT", payload);
      fetchRecords();
    } catch (e) {
      console.error("Lỗi thêm báo cáo:", e);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditDraft({
      request1: r.request1 || 0,
      request2: r.request2 || 0,
      requestUrgent: r.requestUrgent || 0,
      totalReceived: r.totalReceived || 0,
    });
  };

  const saveEdit = async (r) => {
    const oldMoney = r.oldMoney || 0;
    const excessMoney =
      oldMoney +
      Number(editDraft.request1 || 0) +
      Number(editDraft.request2 || 0) +
      Number(editDraft.requestUrgent || 0) -
      Number(editDraft.totalReceived || 0);
    const payload = {
      ...editDraft,
      excessMoney,
      isLocked: Number(editDraft.totalReceived || 0) !== 0,
    };
    try {
      await axios.put(`/api/recordsMKT/${r.id}`, payload);
      setEditingId(null);
      fetchRecords();
    } catch (e) {
      console.error("Lỗi lưu báo cáo:", e);
    }
  };

  const deleteRow = async (r) => {
    if (!window.confirm(`Xóa báo cáo ngày ${r.date}?`)) return;
    try {
      await axios.delete(`/api/recordsMKT/${r.id}`);
      setRecords((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error("Lỗi xóa báo cáo:", e);
    }
  };

  const monthLabel =
    monthOffset === 0
      ? "Tháng Này"
      : `Tháng trước (T${rangeStart.getMonth() + 1}/${rangeStart.getFullYear()})`;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 10 }}>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ fontSize: 13, padding: "7px 10px" }}
          />
        </div>
        <button
          className="btn btn-add"
          onClick={addRow}
          style={{ fontSize: 13, padding: "9px 20px", marginBottom: 16 }}
        >
          Thêm mới Báo cáo
        </button>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 4 }}>
            Chọn thời gian
          </div>
          <select
            value={monthOffset}
            onChange={(e) => setMonthOffset(Number(e.target.value))}
            style={{ fontSize: 13, padding: "7px 12px", minWidth: 200 }}
          >
            <option value={0}>Tháng Này</option>
            <option value={-1}>Tháng trước</option>
          </select>
        </div>
      </div>

      <div
        style={{
          background: "#fce4ec",
          border: "1px solid #f48fb1",
          borderRadius: 8,
          padding: "11px 16px",
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 600,
          color: "#c62828",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span>
          Tổng doanh số: <strong>{fmtVND(totals.totalDoanhSo)}</strong>
        </span>
        <span style={{ color: "#d0a0a8" }}>|</span>
        <span>
          Ads đã xin: <strong>{fmtVND(totals.totalXin)}</strong>
        </span>
        <span style={{ color: "#d0a0a8" }}>|</span>
        <span>
          Tiền thừa:{" "}
          <strong style={{ color: "#16a34a" }}>{fmtVND(totals.tienThua)}</strong>
        </span>
        <span style={{ display: "inline-block", width: 20 }}></span>
        <span style={{ color: "#d0a0a8" }}>|</span>
        <span>
          %ADS xin/DS:{" "}
          <strong
            style={{
              background: "#f48fb1",
              padding: "2px 9px",
              borderRadius: 5,
              color: "#880e4f",
            }}
          >
            {totals.percentXin.toFixed(2)}%
          </strong>
        </span>
        <span style={{ color: "#d0a0a8" }}>|</span>
        <span>
          %ADS tiêu/DS:{" "}
          <strong
            style={{
              background: "#ef9a9a",
              padding: "2px 9px",
              borderRadius: 5,
              color: "#b71c1c",
            }}
          >
            {totals.percentTieu.toFixed(2)}%
          </strong>
        </span>
      </div>

      <div className="mkt-tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left", minWidth: 95 }}>Ngày</th>
              <th style={{ minWidth: 130 }}>Tổng tiền đã tiêu</th>
              <th style={{ minWidth: 130 }}>Xin buổi sáng</th>
              <th style={{ minWidth: 130 }}>Xin buổi chiều</th>
              <th style={{ minWidth: 110 }}>Xin gấp</th>
              <th style={{ minWidth: 95 }}>Tiền dư</th>
              <th style={{ minWidth: 105 }}>Doanh số</th>
              <th style={{ minWidth: 85 }}>%ADS Tiêu</th>
              <th style={{ minWidth: 85 }}>%ADS Xin</th>
              <th style={{ minWidth: 110 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {records
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((r) => {
                const dsNgay = revenueByDay[r.date] || 0;
                const isEditing = editingId === r.id;
                const percentTieu = dsNgay > 0 ? ((r.totalReceived || 0) / dsNgay) * 100 : 0;
                const percentXin =
                  dsNgay > 0
                    ? (((r.request1 || 0) + (r.request2 || 0) + (r.requestUrgent || 0)) /
                        dsNgay) *
                      100
                    : 0;
                return (
                  <tr key={r.id}>
                    <td className="left">{r.date}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.totalReceived}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, totalReceived: e.target.value }))
                          }
                          style={{ width: 90, fontSize: 12, padding: "3px 5px" }}
                        />
                      ) : (
                        (r.totalReceived || 0).toLocaleString("vi-VN")
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.request1}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, request1: e.target.value }))
                          }
                          style={{ width: 90, fontSize: 12, padding: "3px 5px" }}
                        />
                      ) : (
                        (r.request1 || 0).toLocaleString("vi-VN")
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.request2}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, request2: e.target.value }))
                          }
                          style={{ width: 90, fontSize: 12, padding: "3px 5px" }}
                        />
                      ) : (
                        (r.request2 || 0).toLocaleString("vi-VN")
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.requestUrgent}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, requestUrgent: e.target.value }))
                          }
                          style={{ width: 80, fontSize: 12, padding: "3px 5px" }}
                        />
                      ) : (
                        (r.requestUrgent || 0).toLocaleString("vi-VN")
                      )}
                    </td>
                    <td
                      style={{
                        color: (r.excessMoney || 0) >= 0 ? "var(--green)" : "var(--red)",
                        fontWeight: 700,
                      }}
                    >
                      {(r.excessMoney || 0).toLocaleString("vi-VN")}
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmtVND(dsNgay)}</td>
                    <td>
                      <span className={`tag-num ${percentTieu > 35 ? "tag-red" : "tag-grn"}`}>
                        {percentTieu.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`tag-num ${percentXin > 35 ? "tag-red" : "tag-ora"}`}>
                        {percentXin.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button
                            className="btn btn-save"
                            style={{ padding: "3px 8px", fontSize: 10.5 }}
                            onClick={() => saveEdit(r)}
                          >
                            Lưu
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "3px 8px", fontSize: 10.5 }}
                            onClick={() => setEditingId(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "3px 8px", fontSize: 10.5 }}
                            onClick={() => startEdit(r)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn-del"
                            style={{ padding: "3px 8px", fontSize: 10.5 }}
                            onClick={() => deleteRow(r)}
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={10} style={{ padding: 24, color: "var(--light)" }}>
                  Chưa có báo cáo nào trong {monthLabel.toLowerCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
