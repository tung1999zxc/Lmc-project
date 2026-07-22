"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

/* ============================================================
   TAB "QUẢN LÝ ĐƠN HÀNG"
   Nguồn logic gốc: src/app/orders/page.js + components/OrderList.js
   API dùng: GET /api/orders (đủ trường), PUT /api/orders/[id],
             DELETE /api/orders/[id], POST /api/orders/updateIstick,
             POST /api/orders/updateIstickDONE
   Field thật lấy từ DB (collection "orders"):
   orderDate, stt, products[{product,quantity}], pageName, customerName,
   revenuemkt, profitmkt, revenue, profit, istick (Đơn), istickDONE (DONE),
   note, paymentStatus, mkt, saleReport
   ------------------------------------------------------------
   GHI CHÚ QUAN TRỌNG:
   - API DELETE /api/orders/[id] gốc có chặn theo origin/referer
     "https://www.lmcgroupss.com". Nếu bạn deploy domain khác hoặc test ở
     localhost, hãy sửa lại đoạn check đó trong route.js hoặc xoá đi.
   - Cột "Xóa DS" trong mockup không có field tương ứng rõ ràng trong DB gốc,
     tạm map vào field mới `xoaDSNote` (hiển thị "N/A" nếu chưa có).
   ============================================================ */

const DONE_REPORTS = ["DONE", "BOOK TB"];

function fmtVND(n) {
  return (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫";
}

export default function DonHangTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const fmtDate = (d) => d.toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(fmtDate(weekAgo));
  const [toDate, setToDate] = useState(fmtDate(today));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("notdone"); // notdone | all | done
  const [savingId, setSavingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders", {
        params: { startDate: fromDate, endDate: toDate },
      });
      setOrders(res.data.data || []);
    } catch (e) {
      console.error("Lỗi tải đơn hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter === "notdone") {
      list = list.filter((o) => !DONE_REPORTS.includes(o.saleReport));
    } else if (statusFilter === "done") {
      list = list.filter((o) => DONE_REPORTS.includes(o.saleReport));
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((o) => {
        const productNames = Array.isArray(o.products)
          ? o.products.map((p) => p.product).join(" ")
          : "";
        return (
          String(o.stt || "").includes(s) ||
          (o.customerName || "").toLowerCase().includes(s) ||
          (o.pageName || "").toLowerCase().includes(s) ||
          productNames.toLowerCase().includes(s)
        );
      });
    }
    return list;
  }, [orders, statusFilter, search]);

  const totalChuaDone = useMemo(() => {
    return orders
      .filter((o) => !DONE_REPORTS.includes(o.saleReport))
      .reduce((s, o) => s + (Number(o.revenue) || 0), 0);
  }, [orders]);

  const toggleIstick = async (order) => {
    const newVal = !order.istick;
    setSavingId(order.id);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, istick: newVal } : o))
    );
    try {
      await axios.post("/api/orders/updateIstick", {
        orders: [{ id: order.id, istick: newVal }],
      });
    } catch (e) {
      console.error("Lỗi cập nhật Đơn:", e);
      fetchOrders();
    } finally {
      setSavingId(null);
    }
  };

  const toggleDone = async (order) => {
    const newVal = !order.istickDONE;
    setSavingId(order.id);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, istickDONE: newVal } : o))
    );
    try {
      await axios.post("/api/orders/updateIstickDONE", {
        orders: [{ id: order.id, istickDONE: newVal }],
      });
    } catch (e) {
      console.error("Lỗi cập nhật DONE:", e);
      fetchOrders();
    } finally {
      setSavingId(null);
    }
  };

  const togglePayment = async (order) => {
    const newVal =
      order.paymentStatus === "ĐÃ THANH TOÁN" ? "" : "ĐÃ THANH TOÁN";
    setSavingId(order.id);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, paymentStatus: newVal } : o
      )
    );
    try {
      await axios.put(`/api/orders/${order.id}`, { paymentStatus: newVal });
    } catch (e) {
      console.error("Lỗi cập nhật thanh toán:", e);
      fetchOrders();
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Xóa đơn STT ${order.stt}?`)) return;
    try {
      await axios.delete(`/api/orders/${order.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e) {
      console.error("Lỗi xóa đơn:", e);
      window.alert(
        "Không xóa được — API gốc chặn theo domain, xem ghi chú trong DonHangTab.js"
      );
    }
  };

  return (
    <div>
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "8px 12px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--sub)",
            background: "var(--bg)",
            padding: "4px 9px",
            border: "1px solid var(--border)",
            borderRadius: 7,
          }}
        >
          SL ĐƠN:{" "}
          <strong style={{ color: "var(--text)" }}>
            {filteredOrders.length}
          </strong>
        </span>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          Tổng DS Chưa DONE:{" "}
          <span style={{ color: "var(--orange)" }}>{fmtVND(totalChuaDone)}</span>
        </div>
        <button
          className="btn btn-ghost"
          style={{ marginLeft: "auto" }}
          onClick={fetchOrders}
          disabled={loading}
        >
          🔄 {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ fontSize: 11, padding: "5px 7px" }}
        />
        <span style={{ color: "var(--light)", fontSize: 11 }}>→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ fontSize: 11, padding: "5px 7px" }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm STT, tên khách, tên page, sản phẩm..."
          style={{ flex: 1, minWidth: 180, fontSize: 12 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ fontSize: 11, padding: "5px 7px" }}
        >
          <option value="notdone">Đơn chưa hoàn thành</option>
          <option value="all">Tất cả</option>
          <option value="done">Đã hoàn thành</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div className="ord-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left", minWidth: 88 }}>Ngày đặt</th>
                <th style={{ minWidth: 52 }}>STT</th>
                <th style={{ textAlign: "left", minWidth: 160 }}>
                  Sản phẩm · Tên page
                </th>
                <th style={{ textAlign: "left", minWidth: 110 }}>Tên khách</th>
                <th style={{ background: "#f5faff", minWidth: 60 }}>DS MKT</th>
                <th style={{ background: "#f5faff", minWidth: 60 }}>DT MKT</th>
                <th style={{ background: "#f7fdf9", minWidth: 60 }}>DS Sale</th>
                <th style={{ background: "#f7fdf9", minWidth: 60 }}>DT Sale</th>
                <th>Đơn</th>
                <th>DONE</th>
                <th>Ghi chú</th>
                <th>Thanh toán</th>
                <th style={{ minWidth: 65 }}>Xóa DS</th>
                <th>MKT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const productLabel = Array.isArray(o.products)
                  ? o.products.map((p) => p.product).join(", ")
                  : o.category || "";
                const busy = savingId === o.id;
                return (
                  <tr key={o.id} style={{ opacity: busy ? 0.5 : 1 }}>
                    <td
                      className="left"
                      style={{
                        fontSize: 10.5,
                        color: "var(--sub)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.orderDate}
                    </td>
                    <td
                      style={{
                        color: "var(--blue)",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {o.stt}
                    </td>
                    <td className="left">
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                        {productLabel || "—"}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--light)" }}>
                        {o.pageName}
                      </div>
                    </td>
                    <td className="left" style={{ fontSize: 12 }}>
                      {o.customerName}
                    </td>
                    <td style={{ background: "#f5faff", fontWeight: 700 }}>
                      {o.revenuemkt}
                    </td>
                    <td style={{ background: "#f5faff" }}>{o.profitmkt}</td>
                    <td style={{ background: "#f7fdf9", fontWeight: 600 }}>
                      {o.revenue}
                    </td>
                    <td style={{ background: "#f7fdf9" }}>{o.profit}</td>
                    <td>
                      <span
                        onClick={() => toggleIstick(o)}
                        style={{ cursor: "pointer" }}
                      >
                        {o.istick ? (
                          <span className="tag-ok">OK</span>
                        ) : (
                          <span
                            style={{
                              color: "var(--red)",
                              fontWeight: 700,
                            }}
                          >
                            —
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span
                        onClick={() => toggleDone(o)}
                        style={{
                          cursor: "pointer",
                          color: o.istickDONE ? "var(--green)" : "var(--light)",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {o.istickDONE ? "✓ " + (o.shippingDate1 || "") : "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--sub)" }}>
                      {o.note || "—"}
                    </td>
                    <td>
                      <span
                        onClick={() => togglePayment(o)}
                        style={{ cursor: "pointer" }}
                      >
                        {o.paymentStatus === "ĐÃ THANH TOÁN" ? (
                          <span className="tag-ok">Đã TT</span>
                        ) : (
                          <span className="tag-pend">Chưa</span>
                        )}
                      </span>
                    </td>
                    <td style={{ color: "var(--light)", fontSize: 11 }}>
                      {o.xoaDSNote || "N/A"}
                    </td>
                    <td
                      style={{
                        color: "var(--gold-dark)",
                        fontWeight: 600,
                        fontSize: 11.5,
                      }}
                    >
                      {o.mkt}
                    </td>
                    <td>
                      <button
                        className="btn btn-del"
                        style={{ padding: "3px 8px", fontSize: 10.5 }}
                        onClick={() => handleDelete(o)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={15} style={{ padding: 24, color: "var(--light)" }}>
                    Không có đơn hàng phù hợp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
