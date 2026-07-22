"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

/* ============================================================
   TAB "TẤT CẢ SẢN PHẨM"
   Nguồn logic gốc: src/app/products/page.js
   API dùng: GET /api/products, GET /api/orders (để tính SL Done/Đã giao/Âm)
   Field thật (collection "products"): key, name, slvn, sltq, status,
   mkttest, testday, createdAt, imports[{importedQty,importVN,importKR}]
   Field thật (collection "orders"): products:[{product, quantity}],
   deliveryStatus, saleReport, profit
   ------------------------------------------------------------
   Giữ nguyên công thức gốc, bỏ các trường hợp trừ tay riêng cho từng
   tên sản phẩm cụ thể (hack một-lần trong bản gốc) để công thức tổng quát,
   đúng cho MỌI sản phẩm.
   ============================================================ */

const PAGE_SIZE = 15;
const EXCHANGE_RATE = 17000;

function fmtVND(n) {
  return (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫";
}

export default function SanPhamTab() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all | locked | am
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data.data || []);
    } catch (e) {
      console.error("Lỗi tải sản phẩm:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const res = await axios.get("/api/orders", {
        params: {
          startDate: start.toISOString().slice(0, 10),
          endDate: now.toISOString().slice(0, 10),
        },
      });
      setOrders(res.data.data || []);
    } catch (e) {
      console.error("Lỗi tải đơn hàng cho sản phẩm:", e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // Aggregate theo tên sản phẩm — logic gốc từ products/page.js
  const aggMap = useMemo(() => {
    const map = Object.create(null);
    orders.forEach((order) => {
      const deliveryStatus = order.deliveryStatus || "";
      const saleReport = order.saleReport || "";
      const profitNum = Number(order.profit || 0);
      const items = Array.isArray(order.products) ? order.products : [];
      items.forEach((item) => {
        const pname = item.product;
        const qty = Number(item.quantity || 0);
        if (!pname) return;
        if (!map[pname])
          map[pname] = { ordersDone: 0, deliveredQty: 0, totalProfit: 0 };
        map[pname].totalProfit += profitNum;
        if (
          ["ĐÃ GỬI HÀNG", "GIAO THÀNH CÔNG", "BỊ BẮT CHỜ GỬI LẠI"].includes(
            deliveryStatus
          )
        ) {
          map[pname].deliveredQty += qty;
        }
        if (saleReport === "DONE" && (!deliveryStatus || deliveryStatus === "")) {
          map[pname].ordersDone += qty;
        }
      });
    });
    return map;
  }, [orders]);

  const rows = useMemo(() => {
    return products.map((p) => {
      const agg = aggMap[p.name] || { ordersDone: 0, deliveredQty: 0, totalProfit: 0 };
      const totalImported =
        (p.imports || []).reduce(
          (acc, cur) =>
            acc +
            (Number(cur.importedQty) || 0) +
            (Number(cur.importVN) || 0) +
            (Number(cur.importKR) || 0),
          0
        ) +
        (Number(p.slvn) || 0) +
        (Number(p.sltq) || 0);
      const importVNTotal =
        (p.imports || []).reduce((acc, cur) => acc + (Number(cur.importVN) || 0), 0) +
        (Number(p.slvn) || 0);
      const importKRTotal = (p.imports || []).reduce(
        (acc, cur) => acc + (Number(cur.importKR) || 0),
        0
      );
      const slAm = totalImported - agg.ordersDone - agg.deliveredQty;
      return {
        ...p,
        totalImported,
        importVNTotal,
        importKRTotal,
        ordersDone: agg.ordersDone,
        deliveredQty: agg.deliveredQty,
        slAm,
        totalDoanhSo: agg.totalProfit * EXCHANGE_RATE,
      };
    });
  }, [products, aggMap]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (filterMode === "locked") {
      list = list.filter((r) => r.status === "locked" || r.mkttest === "khoa");
    } else if (filterMode === "am") {
      list = [...list].sort((a, b) => a.slAm - b.slAm).slice(0, 20);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((r) => (r.name || "").toLowerCase().includes(s));
    }
    return list;
  }, [rows, filterMode, search]);

  const total = filteredRows.reduce((s, r) => s + r.totalDoanhSo, 0);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn btn-ghost"
            style={filterMode === "locked" ? { borderColor: "var(--gold)" } : {}}
            onClick={() => {
              setFilterMode(filterMode === "locked" ? "all" : "locked");
              setPage(1);
            }}
          >
            🔒 SP bị khóa
          </button>
          <button
            className="btn btn-ghost"
            style={filterMode === "am" ? { borderColor: "var(--gold)" } : {}}
            onClick={() => {
              setFilterMode(filterMode === "am" ? "all" : "am");
              setPage(1);
            }}
          >
            📉 SP âm nhiều nhất
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFilterMode("all");
              setPage(1);
            }}
          >
            Tất cả
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="🔍 Tìm sản phẩm..."
          style={{ fontSize: 12, flex: 1, maxWidth: 300 }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text)",
            marginLeft: "auto",
          }}
        >
          Tổng: <span style={{ color: "var(--red)" }}>{fmtVND(total)}</span>
        </span>
      </div>

      <div className="sp-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Tên sản phẩm</th>
              <th>Nhập tổng</th>
              <th>Nhập VIỆT</th>
              <th>Nhập HÀN</th>
              <th>Done chưa gửi</th>
              <th>Đã giao TC</th>
              <th>SL Âm</th>
              <th>MKT Test</th>
              <th>Ngày khóa / %</th>
              <th>Ngày lên Data</th>
              <th>Tổng DS</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.key || r._id}>
                <td className="left">{r.name}</td>
                <td>{r.totalImported}</td>
                <td>{r.importVNTotal}</td>
                <td>{r.importKRTotal}</td>
                <td>{r.ordersDone}</td>
                <td>{r.deliveredQty}</td>
                <td
                  style={{
                    color: r.slAm < 0 ? "var(--red)" : "var(--text)",
                    fontWeight: r.slAm < 0 ? 700 : 500,
                  }}
                >
                  {r.slAm}
                </td>
                <td>{r.mkttest || "—"}</td>
                <td>{r.testday || "—"}</td>
                <td>
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </td>
                <td style={{ fontWeight: 700 }}>{fmtVND(r.totalDoanhSo)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && !loading && (
              <tr>
                <td colSpan={11} style={{ padding: 24, color: "var(--light)" }}>
                  Không tìm thấy sản phẩm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`pg-btn${page === i + 1 ? " active" : ""}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
