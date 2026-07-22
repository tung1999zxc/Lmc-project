"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

/* ============================================================
   TAB "TÊN PAGE"
   Nguồn logic gốc: src/app/pagesName/page.js
   API dùng: GET/POST /api/pageName, DELETE /api/pageName/[key],
             GET /api/orders (để tính ngày DS gần nhất / số ngày không ra đơn)
   Field thật (collection "pageName"): key, pageName, employee,
   employee_code, createdAt
   ------------------------------------------------------------
   "Ngày DS gần nhất" & "Số ngày không ra đơn" KHÔNG có sẵn trong bản gốc —
   đây là phân tích mới, tính bằng cách đối chiếu pageName với order.pageName
   + order.orderDate trong 90 ngày gần nhất.
   ============================================================ */

export default function TenPageTab() {
  const currentUser = useSelector((state) => state.user.currentUser) || {};
  const [pages, setPages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newPageName, setNewPageName] = useState("");
  const [search, setSearch] = useState("");
  const [minNoOrderDays, setMinNoOrderDays] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/pageName");
      setPages(res.data.data || []);
    } catch (e) {
      console.error("Lỗi tải danh sách page:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const now = new Date();
      const start = new Date(now.getTime() - 90 * 86400000);
      const res = await axios.get("/api/orders", {
        params: {
          startDate: start.toISOString().slice(0, 10),
          endDate: now.toISOString().slice(0, 10),
        },
      });
      setOrders(res.data.data || []);
    } catch (e) {
      console.error("Lỗi tải đơn hàng cho tab Tên page:", e);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchOrders();
  }, []);

  const isDuplicate = useMemo(() => {
    const name = newPageName.trim().toLowerCase();
    if (!name) return false;
    return pages.some((p) => (p.pageName || "").trim().toLowerCase() === name);
  }, [newPageName, pages]);

  const lastOrderDateByPage = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!o.pageName || !o.orderDate) return;
      if (!map[o.pageName] || o.orderDate > map[o.pageName]) {
        map[o.pageName] = o.orderDate;
      }
    });
    return map;
  }, [orders]);

  const rows = useMemo(() => {
    const today = new Date();
    return pages
      .filter((p) => p.employee === currentUser.name)
      .map((p) => {
        const lastDate = lastOrderDateByPage[p.pageName];
        const noOrderDays = lastDate
          ? Math.floor((today - new Date(lastDate)) / 86400000)
          : null;
        return { ...p, lastDate, noOrderDays };
      });
  }, [pages, lastOrderDateByPage, currentUser.name]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((r) => (r.pageName || "").toLowerCase().includes(s));
    }
    if (minNoOrderDays) {
      const min = Number(minNoOrderDays);
      list = list.filter((r) => (r.noOrderDays === null ? true : r.noOrderDays >= min));
    }
    return list;
  }, [rows, search, minNoOrderDays]);

  const noOrderTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return rows.filter((r) => r.lastDate !== todayStr).length;
  }, [rows]);

  const addPage = async () => {
    if (!newPageName.trim() || isDuplicate) return;
    try {
      await axios.post("/api/pageName", {
        pageName: newPageName.trim(),
        employee: currentUser.name,
        employee_code: currentUser.employee_code,
      });
      setNewPageName("");
      fetchPages();
    } catch (e) {
      console.error("Lỗi thêm page:", e);
    }
  };

  const deletePage = async (p) => {
    if (!window.confirm(`Xóa page "${p.pageName}"?`)) return;
    try {
      await axios.delete(`/api/pageName/${p.key}`);
      setPages((prev) => prev.filter((x) => x.key !== p.key));
    } catch (e) {
      console.error("Lỗi xóa page:", e);
    }
  };

  return (
    <div>
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              placeholder="Nhập tên page..."
              style={{ width: "100%", fontSize: 13, padding: "7px 10px" }}
            />
            {isDuplicate && (
              <div className="alert-red" style={{ marginTop: 6, fontSize: 11, padding: "6px 10px" }}>
                ⚠ Tên page này đã tồn tại — cần đổi tên trước khi thêm!
              </div>
            )}
          </div>
          <button className="btn btn-add" onClick={addPage} disabled={isDuplicate || !newPageName.trim()}>
            Thêm page
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--sub)" }}>
          Page sẽ được gắn với tên:{" "}
          <strong style={{ color: "var(--text)" }}>{currentUser.name || "—"}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div className="alert-gold" style={{ flex: 1 }}>
          <span>📅 Không ra đơn hôm nay: </span>
          <strong>{noOrderTodayCount}</strong> page
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--sub)" }}>Page lâu không ra DS:</span>
          <select
            value={minNoOrderDays}
            onChange={(e) => setMinNoOrderDays(e.target.value)}
            style={{ fontSize: 12 }}
          >
            <option value="">Tất cả</option>
            <option value="7">≥ 7 ngày</option>
            <option value="14">≥ 14 ngày</option>
            <option value="30">≥ 30 ngày</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm tên page..."
            style={{ fontSize: 12, width: 220 }}
          />
        </div>
      </div>

      <div className="pg-tbl">
        <table>
          <thead>
            <tr>
              <th>Tên Page</th>
              <th>Ngày thêm</th>
              <th>Ngày DS gần nhất</th>
              <th>Số ngày không ra đơn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.key}>
                <td style={{ fontWeight: 600 }}>{r.pageName}</td>
                <td>
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td>{r.lastDate || "Chưa có đơn"}</td>
                <td>
                  {r.noOrderDays === null ? (
                    "—"
                  ) : (
                    <span className={`tag-num ${r.noOrderDays >= 7 ? "tag-red" : "tag-grn"}`}>
                      {r.noOrderDays} ngày
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-copy"
                    style={{ marginRight: 6 }}
                    onClick={() => navigator.clipboard.writeText(r.pageName)}
                  >
                    Copy
                  </button>
                  <button
                    className="btn btn-del"
                    style={{ padding: "3px 8px", fontSize: 10.5 }}
                    onClick={() => deletePage(r)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: 24, color: "var(--light)" }}>
                  Chưa có page nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
