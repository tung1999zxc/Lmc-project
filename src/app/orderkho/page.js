"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

dayjs.extend(isBetween);

/* ─────────────────────────────────────────────
   CSS – toàn bộ style từ file HTML giao diện mới
   ───────────────────────────────────────────── */
const CSS = `
:root{
  --sb:#13203a;--sb2:#0d1828;--sb-hover:#1c2e4a;--sb-active:#1d63ed;
  --sb-line:#1e2e47;--sb-txt:#9baec8;--sb-dim:#4e6080;
  --accent:#1d63ed;--accent-s:#e8f0ff;--accent-p:#1450c0;
  --bg:#f0f3f8;--card:#fff;--line:#e3e8f0;--line2:#edf1f7;
  --ink:#16203a;--ink2:#445068;--muted:#8b95a9;
  --green:#14a06b;--green-s:#e2f6ef;
  --amber:#d98a00;--amber-s:#fff3db;
  --red:#e0524d;--red-s:#fdeceb;
  --purple:#7c3aed;--purple-s:#f0eaff;
  --orange:#ea580c;--orange-s:#fff4ed;
  --r:11px;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
.kho-root{background:var(--bg);color:var(--ink);display:flex;overflow:visible;-webkit-font-smoothing:antialiased;height:100vh;width:100%}
button{font-family:inherit;cursor:pointer;border:none;background:none}
input,textarea,select{font-family:inherit}
.kho-root ::-webkit-scrollbar{width:7px;height:7px}
.kho-root ::-webkit-scrollbar-thumb{background:#c5cedd;border-radius:8px}

/* SIDEBAR */
.sb{width:248px;flex-shrink:0;background:linear-gradient(180deg,var(--sb) 0%,var(--sb2) 100%);
  color:var(--sb-txt);display:flex;flex-direction:column;height:100vh;border-right:1px solid #090e1a}
.brand{display:flex;align-items:center;gap:11px;padding:18px 16px 14px}
.brand .ico{width:36px;height:36px;border-radius:9px;flex-shrink:0;
  background:linear-gradient(135deg,#3b7fff,#1d63ed);display:flex;align-items:center;
  justify-content:center;color:#fff;font-weight:800;font-size:14px;box-shadow:0 3px 10px rgba(29,99,237,.35)}
.brand .nm{font-size:15px;font-weight:700;color:#fff}
.brand .sub{font-size:10.5px;color:var(--sb-dim);margin-top:1px}
.nav{flex:1;overflow-y:auto;padding:4px 10px 10px}
.nl{font-size:10px;font-weight:700;letter-spacing:1.1px;color:var(--sb-dim);text-transform:uppercase;padding:14px 8px 6px}
.ni{display:flex;align-items:center;gap:10px;width:100%;padding:10px 11px;border-radius:9px;
  color:var(--sb-txt);font-size:13px;font-weight:500;text-align:left;transition:.12s;background:none;border:none;cursor:pointer}
.ni svg{width:16px;height:16px;stroke-width:2;flex-shrink:0}
.ni:hover{background:var(--sb-hover);color:#fff}
.ni.on{background:var(--sb-active);color:#fff;box-shadow:0 2px 8px rgba(29,99,237,.3)}
.ni .pill{margin-left:auto;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;min-width:22px;text-align:center}
.ni.on .pill{background:rgba(255,255,255,.2);color:#fff}
.ni:not(.on) .pill{background:#1c3060;color:#7db4ff}
.ni.v-unsent:not(.on) .pill{background:#3a2800;color:#fbbf24}
.ni.v-sent:not(.on) .pill{background:#0d2e1e;color:#34d399}
.ni.v-done:not(.on) .pill{background:#0e2718;color:#4ade80}
.ni.v-late:not(.on) .pill{background:#3a1010;color:#f87171}
.ni.v-reconcile:not(.on) .pill{background:#2a1060;color:#c084fc}
.sb-qa{padding:0 10px}
.qa-btn{display:flex;align-items:center;gap:9px;width:100%;padding:8px 10px;border-radius:7px;
  color:var(--sb-txt);font-size:12px;font-weight:500;text-align:left;transition:.12s;border:none;background:none;cursor:pointer}
.qa-btn svg{width:14px;height:14px;stroke-width:2;flex-shrink:0}
.qa-btn:hover{background:var(--sb-hover);color:#fff}
.qa-btn.danger:hover{background:#3a1d20;color:#ff8b86}
.sbf{border-top:1px solid var(--sb-line);padding:10px}
.ver{font-size:10px;color:var(--sb-dim);padding:5px 10px 2px}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;height:100vh;min-width:0}
.topbar{background:var(--card);border-bottom:1px solid var(--line);
  padding:0 18px;height:58px;flex-shrink:0;display:flex;align-items:center;gap:12px}
.pt{font-size:15px;font-weight:700;white-space:nowrap}
.pt small{display:block;font-size:10.5px;color:var(--muted);font-weight:500;margin-top:1px}
.view-badge{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:700}
.vb-all{background:var(--accent-s);color:var(--accent)}
.vb-unsent{background:var(--amber-s);color:var(--amber)}
.vb-sent{background:var(--green-s);color:var(--green)}
.vb-done{background:#e0faf0;color:#0d8a5a}
.vb-late{background:var(--red-s);color:var(--red)}
.vb-reconcile{background:var(--purple-s);color:var(--purple)}
.srch{flex:1;max-width:320px;position:relative}
.srch svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--muted);stroke-width:2}
.srch input{width:100%;background:var(--bg);border:1px solid var(--line);border-radius:8px;
  padding:8px 10px 8px 31px;font-size:12.5px;outline:none;color:var(--ink)}
.srch input:focus{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-s)}
.tbr{margin-left:auto;display:flex;align-items:center;gap:10px}
.cnt{display:flex;align-items:center;gap:6px;background:var(--accent-s);color:var(--accent);font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px}
.cnt b{font-size:13px}
.av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b7fff,#1d63ed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
.uname{font-size:12px;font-weight:600}.urole{font-size:10px;color:var(--muted)}

/* CONTENT */
.content{flex:1;overflow:auto;padding:14px 18px 80px;display:flex;flex-direction:column;gap:12px;min-height: 0;}

/* TOOL PANEL */
.tool-panel{background:var(--card);border:1px solid var(--line);border-radius:var(--r)}
.tp-head{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line);cursor:pointer;user-select:none}
.tp-head .tph-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tph-blue{background:var(--accent-s)}.tph-blue svg{color:var(--accent);width:14px;height:14px;stroke-width:2}
.tph-purple{background:var(--purple-s)}.tph-purple svg{color:var(--purple);width:14px;height:14px;stroke-width:2}
.tp-head h3{font-size:12.5px;font-weight:700;color:var(--ink)}
.tp-head p{font-size:11px;color:var(--muted);margin-top:1px}
.tp-head .chevron{margin-left:auto;color:var(--muted);transition:.2s}
.tp-head .chevron svg{width:14px;height:14px;stroke-width:2}
.tp-head.collapsed .chevron{transform:rotate(-90deg)}
.tp-body{padding:12px 14px}
.tp-body.hidden{display:none}

/* Lọc SP */
.prod-search-wrap{position:relative;margin-bottom:8px}
.prod-search-wrap svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:var(--muted);stroke-width:2;pointer-events:none}
.prod-search-wrap input{width:100%;background:var(--bg);border:1.5px solid var(--line);border-radius:8px;padding:7px 10px 7px 30px;font-size:12.5px;outline:none;color:var(--ink)}
.prod-search-wrap input:focus{border-color:var(--accent);background:#fff}
.prod-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px;max-height:68px;overflow-y:auto}
.pchip{padding:4px 11px;border-radius:20px;font-size:11.5px;font-weight:600;cursor:pointer;
  border:1.5px solid var(--line);color:var(--ink2);background:var(--bg);transition:.12s;white-space:nowrap;
  display:inline-flex;align-items:center;gap:5px}
.pchip:hover{border-color:var(--accent);color:var(--accent)}
.pchip.sel{background:var(--accent-s);border-color:var(--accent);color:var(--accent)}
.sp-summary{display:none;background:var(--line2);border-radius:8px;padding:7px 10px;margin-bottom:8px;
  font-size:11.5px;color:var(--ink2);font-weight:600}
.sp-summary.show{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sp-tag{background:var(--accent);color:#fff;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
.panel-actions{display:flex;gap:7px;flex-wrap:wrap}

/* Ghép mã */
.dual-paste{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}
.dp-col label{font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:5px}
.dp-col textarea{width:100%;background:var(--bg);border:1.5px solid var(--line);border-radius:8px;
  padding:8px 10px;font-size:12px;font-family:ui-monospace,monospace;resize:none;outline:none;color:var(--ink);height:88px;line-height:1.7}
.dp-col textarea:focus{border-color:var(--accent);background:#fff}
.match-preview{background:var(--bg);border:1px solid var(--line);border-radius:8px;
  margin-bottom:8px;max-height:110px;overflow-y:auto}
.mp-head{font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;
  padding:6px 10px;border-bottom:1px solid var(--line);background:#f8fafd;border-radius:8px 8px 0 0}
.mp-list{padding:6px 10px;display:flex;flex-direction:column;gap:3px}
.mp-row{display:flex;align-items:center;gap:8px;font-size:11.5px}
.match-ok{color:var(--green);font-weight:700}
.match-err{color:var(--red);font-weight:700}
.track-note{font-size:11.5px;font-weight:600;color:var(--green);margin-top:6px}

/* TABLE CARD */
.tcard{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow: visible}
.ch{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.ch h2{font-size:13.5px;font-weight:700}
.ch small{font-size:11px;color:var(--muted);display:block;margin-top:1px}
.btn-row{display:flex;gap:7px;margin-left:auto;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:8px;font-size:12px;font-weight:600;transition:.12s;white-space:nowrap;cursor:pointer;border:none}
.btn svg{width:13px;height:13px;stroke-width:2}
.btn-pri{background:var(--accent);color:#fff}.btn-pri:hover{background:var(--accent-p)}
.btn-sec{background:var(--accent-s);color:var(--accent)}.btn-sec:hover{background:var(--accent);color:#fff}
.btn-green{background:var(--green-s);color:var(--green)}.btn-green:hover{background:var(--green);color:#fff}
.btn-purple{background:var(--purple-s);color:var(--purple)}.btn-purple:hover{background:var(--purple);color:#fff}
.btn-red{background:var(--red-s);color:var(--red)}.btn-red:hover{background:var(--red);color:#fff}
.btn-ghost{background:var(--line2);color:var(--ink2)}.btn-ghost:hover{background:var(--line)}
.btn-sm{padding:5px 10px;font-size:11.5px}
.btn-amber{background:var(--amber-s);color:var(--amber)}.btn-amber:hover{background:var(--amber);color:#fff}

/* table */
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:900px}
thead th{background:#f8fafd;text-align:left;font-size:10px;font-weight:700;letter-spacing:.4px;color:var(--ink2);
  text-transform:uppercase;padding:9px 11px;border-bottom:1px solid var(--line);white-space:nowrap;position:sticky;top:0;z-index:1}
tbody td{padding:10px 11px;font-size:12px;border-bottom:1px solid var(--line2);color:var(--ink);vertical-align:middle}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#f7fafd}
tbody tr.late-row td{background:#fff8f8}
tbody tr.late-row:hover td{background:#fff0f0}

/* late badge */
.late-badge{display:inline-flex;align-items:center;gap:4px;background:var(--red-s);color:var(--red);
  font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px}

/* inline track input */
.tinput{width:140px;background:var(--bg);border:1px solid var(--line);border-radius:6px;
  padding:5px 7px;font-size:11.5px;font-family:ui-monospace,monospace;outline:none;color:var(--ink)}
.tinput:focus{border-color:var(--accent);background:#fff}
.tinput.filled{border-color:var(--green);color:var(--green);background:var(--green-s);font-weight:700}

/* checkbox */
.cbx{width:20px;height:20px;border:2px solid var(--line);border-radius:5px;
  display:flex;align-items:center;justify-content:center;transition:.12s;background:#fff;margin:0 auto;cursor:pointer;border:none;padding:0}
.cbx svg{width:11px;height:11px;color:#fff;stroke-width:3}
.cbx.on{background:var(--accent);border:2px solid var(--accent)}
.cbx.on-g{background:var(--green);border:2px solid var(--green)}
.cbx.on-p{background:var(--purple);border:2px solid var(--purple)}
.master-cbx{width:18px;height:18px;border:2px solid #8ba3c0;border-radius:4px;
  display:flex;align-items:center;justify-content:center;transition:.12s;background:transparent;cursor:pointer;margin:0 auto;padding:0}
.master-cbx.on{background:var(--accent);border-color:var(--accent)}
.master-cbx.partial{border-color:var(--accent)}
td.ctr{text-align:center}

/* chips */
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:10.5px;font-weight:700;white-space:nowrap}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.done-c{background:var(--green-s);color:var(--green)}.done-c .dot{background:var(--green)}
.ship-c{background:var(--amber-s);color:var(--amber)}.ship-c .dot{background:var(--amber)}
.unsent-c{background:var(--orange-s);color:var(--orange)}.unsent-c .dot{background:var(--orange)}
.late-c{background:var(--red-s);color:var(--red)}.late-c .dot{background:var(--red)}
.rec-c{background:var(--purple-s);color:var(--purple)}.rec-c .dot{background:var(--purple)}

.track-txt{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--ink2);font-weight:600}
.cust{font-weight:600;font-size:12.5px}
.phone{color:var(--ink2);font-size:11.5px;white-space:nowrap}
.stt-n{color:var(--muted);font-weight:700;font-size:11.5px}
.prods{display:flex;flex-direction:column;gap:2px}
.ptag{display:inline-flex;align-items:center;gap:4px;font-size:11px;background:var(--line2);
  color:var(--ink2);padding:2px 7px;border-radius:5px;font-weight:600;width:fit-content}
.ptag .sl{color:var(--accent);font-weight:700}
.ptag.hi{background:#dbeafe;color:#1d63ed}
.addr-thumb{width:34px;height:34px;border-radius:6px;object-fit:cover;border:1px solid var(--line)}
.edit-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;color:var(--muted);transition:.12s;margin:0 auto;border:none;background:none;cursor:pointer}
.edit-btn svg{width:13px;height:13px;stroke-width:2}
.edit-btn:hover{background:var(--accent-s);color:var(--accent)}

/* save bar */
.sb-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:11px 14px;border-top:1px solid var(--line);background:#f8fafd;flex-wrap:wrap}
.sb-bar .sel{font-size:12px;color:var(--ink2);font-weight:600}
.stat-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;
  font-size:11.5px;font-weight:700}
.sp-blue{background:var(--accent-s);color:var(--accent)}
.sp-amber{background:var(--amber-s);color:var(--amber)}
.sp-green{background:var(--green-s);color:var(--green)}

/* bulk float bar */
.bulk-bar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(16px);
  background:#16203a;color:#fff;border-radius:14px;display:flex;align-items:center;gap:10px;
  padding:10px 16px;box-shadow:0 8px 32px rgba(10,15,30,.35);opacity:0;pointer-events:none;
  transition:.22s;z-index:200;white-space:nowrap;border:1px solid #2a3a5a;min-width:360px}
.bulk-bar.show{opacity:1;pointer-events:all;transform:translateX(-50%) translateY(0)}
.bulk-count{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;padding-right:10px;border-right:1px solid #2a3a5a;margin-right:2px}
.bulk-count .n{background:var(--accent);color:#fff;border-radius:6px;padding:2px 9px;font-size:13px;font-weight:800}
.bulk-actions{display:flex;align-items:center;gap:7px;flex:1}
.bb{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:8px;font-size:12px;font-weight:700;transition:.12s;font-family:inherit;cursor:pointer;border:none;white-space:nowrap}
.bb svg{width:13px;height:13px;stroke-width:2.2;flex-shrink:0}
.bb-blue{background:#1d63ed;color:#fff}.bb-blue:hover{background:#1450c0}
.bb-green{background:#14a06b;color:#fff}.bb-green:hover{background:#0e7a52}
.bb-purple{background:#7c3aed;color:#fff}.bb-purple:hover{background:#6228d0}
.bb-ghost{background:#ffffff18;color:#cbd5e8}.bb-ghost:hover{background:#ffffff28}
.bulk-close{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#8ba3c0;transition:.12s;cursor:pointer;border:none;background:none;margin-left:2px}
.bulk-close svg{width:14px;height:14px;stroke-width:2.5}

/* step flow */
.flow-hint{display:flex;align-items:center;gap:0;margin-bottom:12px;overflow-x:auto;padding:2px 0}
.flow-step{display:flex;align-items:center;gap:7px;padding:7px 13px;background:var(--card);
  border:1px solid var(--line);border-radius:8px;font-size:11.5px;font-weight:600;color:var(--ink2);white-space:nowrap}
.flow-step.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.flow-step .snum{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}
.flow-step:not(.active) .snum{background:var(--line2);color:var(--muted)}
.flow-arrow{color:var(--muted);padding:0 6px;font-size:14px;flex-shrink:0}

/* empty */
.empty-state{padding:48px 20px;text-align:center}
.empty-state svg{width:44px;height:44px;color:#c8d2e0;stroke-width:1.5;margin-bottom:10px}
.empty-state p{color:var(--muted);font-size:13px}

/* toast */
.kho-toast{position:fixed;bottom:80px;right:22px;background:#16203a;color:#fff;padding:10px 16px;
  border-radius:10px;font-size:12.5px;font-weight:600;box-shadow:0 6px 24px rgba(0,0,0,.22);
  opacity:0;pointer-events:none;transform:translateY(6px);transition:.22s;z-index:300}
.kho-toast.show{opacity:1;transform:translateY(0)}

/* loading overlay */
.kho-loading{position:fixed;inset:0;background:rgba(16,26,50,.55);display:flex;align-items:center;
  justify-content:center;z-index:999;flex-direction:column;gap:14px}
.kho-spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.2);
  border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
.kho-loading p{color:#fff;font-size:13px;font-weight:600}
@keyframes spin{to{transform:rotate(360deg)}}
`;

/* ─── SVG helpers ─── */
const CHK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const LATE_DAYS = 10;

/* ─── Mapping backend order → UI order ─── */
function mapOrder(o) {
  // Backend fields: stt, customerName, phone, address, products[], trackingCode,
  // deliveryStatus, shippingDate1, shippingDate2, orderDate, category, reconciled, istick, istick4
  const ngayGui = o.shippingDate1 ? dayjs(o.shippingDate1).format("DD/MM") : "";
  const ngayNhan = o.shippingDate2 ? dayjs(o.shippingDate2).format("DD/MM") : "";
  const ngayDat = o.orderDate4 || o.orderDate
    ? dayjs(o.orderDate4 || o.orderDate).format("DD/MM")
    : "";

  const delivered =
    o.deliveryStatus === "GIAO THÀNH CÔNG" ;
  const reconciled = o.reconciled === true;

  // Tính số ngày đang giao
  let daysShipping = 0;
  if (ngayGui && !delivered) {
    const sent = dayjs(o.shippingDate1);
    daysShipping = dayjs().diff(sent, "day");
  }

  const prods = Array.isArray(o.products)
    ? o.products.map((p) => p.product || "")
    : [];
  const qty = Array.isArray(o.products)
    ? o.products.map((p) => Number(p.quantity) || 1)
    : [];

  return {
    ...o,
    // UI fields
    prods,
    qty,
    cust: o.customerName || "",
    sdt: o.phone || "",
    addr: o.address || "",
    qua: o.category || "",
    ngayDat,
    ngayGui,
    ngayNhan,
    daysShipping,
    delivered,
    reconciled,
    track: o.trackingCode || "",
  };
}

/* ─── View config ─── */
const VIEW_CFG = {
  all:       { title: "Tất cả đơn hàng",       sub: "Tất cả",              badgeCls: "vb-all",       badge: "Tất cả" },
  unsent:    { title: "Chưa gửi hàng",          sub: "Chưa có ngày gửi",   badgeCls: "vb-unsent",    badge: "Chưa gửi" },
  sent:      { title: "Đã gửi hàng",            sub: "Đang giao",          badgeCls: "vb-sent",      badge: "Đã gửi" },
  late:      { title: "Giao lâu – Cần check",   sub: `Giao quá ${LATE_DAYS} ngày chưa về`, badgeCls: "vb-late", badge: "Cần check" },
  done:      { title: "Giao thành công",         sub: "Đã về tay khách",    badgeCls: "vb-done",      badge: "Giao TC" },
  reconcile: { title: "Đối soát",               sub: "Đã đối soát",        badgeCls: "vb-reconcile", badge: "Đối soát" },
};
const VIEWS = ["all", "unsent", "sent", "late", "done", "reconcile"];

function isLate(o) {
  return o.ngayGui && !o.delivered && o.daysShipping > LATE_DAYS;
}

function getViewList(orders, view) {
  switch (view) {
    case "all":       return orders.slice();
    case "unsent":    return orders.filter((o) => !o.ngayGui);
    case "sent":      return orders.filter((o) => o.ngayGui && !o.delivered && !o.reconciled);
    case "late":      return orders.filter((o) => isLate(o));
    case "done":      return orders.filter((o) => o.delivered && !o.reconciled);
    case "reconcile": return orders.filter((o) => o.reconciled);
    default:          return [];
  }
}

/* ─────────────────────────────────────────────
   COMPONENT CHÍNH
   ───────────────────────────────────────────── */
export default function KhoOrderList() {
  const currentUser = useSelector((state) => state.user.currentUser);
  const router = useRouter();

  // ── State ──
  const [orders, setOrders] = useState([]);
  const [initialOrders, setInitialOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [activeProds, setActiveProds] = useState(new Set());
  const [prodSearch, setProdSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set()); // id đơn đang chọn (bulk)
  const [deliveredIds, setDeliveredIds] = useState(new Set()); // id đã tích Giao TC
  const [reconciledIds, setReconciledIds] = useState(new Set()); // id đã tích Đối soát
  const [toast, setToast] = useState({ msg: "", show: false });
  const toastTimer = useRef(null);

  // Panel ghép mã
  const [bulkStt, setBulkStt] = useState("");
  const [bulkTrack, setBulkTrack] = useState("");
  const [matchPreview, setMatchPreview] = useState(null); // null | array
  const [trackNote, setTrackNote] = useState("");

  // Panel collapse
  const [p1collapsed, setP1collapsed] = useState(false);
  const [p2collapsed, setP2collapsed] = useState(false);

  // ── Auth guard ──
  useEffect(() => {
    if (!currentUser?.name) router.push("/login");
  }, []);

  // ── Fetch đơn hàng kho ──
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders/orderkhohq", {
  params: {
    filter: "failed",
    isShippingName: currentUser.name,
  },
});
      const raw = res.data.data || [];
      const mapped = raw.map(mapOrder);
      setOrders(mapped);
      setInitialOrders(mapped);
      // Khởi tạo trạng thái delivered / reconciled từ dữ liệu
      setDeliveredIds(new Set(mapped.filter((o) => o.delivered).map((o) => o.id)));
      setReconciledIds(new Set(mapped.filter((o) => o.reconciled).map((o) => o.id)));
    } catch (err) {
      console.error("Lỗi khi lấy đơn hàng kho:", err);
      showToast("Lỗi khi lấy đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Toast helper ──
  function showToast(msg) {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  }

  // ── Danh sách theo view (áp dụng delivered/reconciled từ state) ──
  const ordersWithState = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      delivered: deliveredIds.has(o.id) ? true : o.delivered,
      reconciled: reconciledIds.has(o.id) ? true : o.reconciled,
    }));
  }, [orders, deliveredIds, reconciledIds]);

  const viewList = useMemo(() => {
    return getViewList(ordersWithState, currentView);
  }, [ordersWithState, currentView]);

  // ── Tìm kiếm ──
  const searchedList = useMemo(() => {
    if (!searchQ.trim()) return viewList;
    const q = searchQ.trim().toLowerCase();
    return viewList.filter((o) =>
      (o.cust + o.sdt + o.track + String(o.stt)).toLowerCase().includes(q)
    );
  }, [viewList, searchQ]);

  // ── Lọc sản phẩm ──
  const filteredList = useMemo(() => {
    if (activeProds.size === 0) return searchedList;
    const matched = searchedList.filter((o) =>
      o.prods.some((p) => activeProds.has(p))
    );
    // sort: nhóm theo SP được chọn đầu tiên
    const prodOrder = [...activeProds];
    return [...matched].sort((a, b) => {
      const ai = prodOrder.findIndex((p) => a.prods.includes(p));
      const bi = prodOrder.findIndex((p) => b.prods.includes(p));
      return ai - bi;
    });
  }, [searchedList, activeProds]);

  // ── Pill counts ──
  const pillCounts = useMemo(() => ({
    all:       ordersWithState.length,
    unsent:    ordersWithState.filter((o) => !o.ngayGui).length,
    sent:      ordersWithState.filter((o) => o.ngayGui && !o.delivered && !o.reconciled).length,
    late:      ordersWithState.filter((o) => isLate(o)).length,
    done:      ordersWithState.filter((o) => o.delivered && !o.reconciled).length,
    reconcile: ordersWithState.filter((o) => o.reconciled).length,
  }), [ordersWithState]);

  // ── Prod chips ──
  const allProds = useMemo(() => {
    const set = new Set();
    viewList.forEach((o) => o.prods.forEach((p) => set.add(p)));
    return [...set];
  }, [viewList]);

  const filteredProdChips = useMemo(() => {
    if (!prodSearch.trim()) return allProds;
    return allProds.filter((p) =>
      p.toLowerCase().includes(prodSearch.toLowerCase())
    );
  }, [allProds, prodSearch]);

  // ── Checkbox helpers ──
  const selectedCount = selectedIds.size;

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleMaster() {
    const ids = filteredList.map((o) => o.id);
    const allOn = ids.every((id) => selectedIds.has(id));
    if (allOn) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ── Giao TC toggle (per-row) ──
  function toggleDelivered(id) {
    setDeliveredIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Đối soát toggle (per-row) ──
  function toggleReconciled(id) {
    setReconciledIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Save Giao TC (gọi API cập nhật deliveryStatus) ──
  async function saveDelivered() {
  const toUpdate = filteredList.filter(
    (o) => deliveredIds.has(o.id) && !o.delivered
  );

  if (!toUpdate.length) {
    showToast("Không có đơn nào để lưu");
    return;
  }

  try {
    await axios.post("/api/orders/updateIstickDONE", {
      orders: toUpdate.map((o) => ({
        id: o.id,
        istickDONE: true,
      })),
    });

    showToast(`Đã lưu Giao TC cho ${toUpdate.length} đơn ✓`);
    fetchOrders();
    setTimeout(() => setCurrentView("done"), 700);
  } catch (err) {
    console.error(err);
    showToast("Lỗi khi lưu Giao TC");
  }
}

  // ── Save Đối soát ──
  async function saveReconcile() {
    const toUpdate = filteredList.filter((o) => reconciledIds.has(o.id) && !o.reconciled);
    if (!toUpdate.length) { showToast("Không có đơn nào để lưu"); return; }
    try {
      await axios.post("/api/orders/updateReconciled", {
        orders: toUpdate.map(({ id }) => ({ id, reconciled: true })),
      });
      showToast(`Đã chuyển ${toUpdate.length} đơn sang Đối soát ✓`);
      fetchOrders();
      setTimeout(() => setCurrentView("reconcile"), 700);
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu Đối soát");
    }
  }

  // ── Tick tất cả Giao TC ──
async function tickAllDelivered() {
  if (!filteredList.length) {
    showToast("Không có đơn nào");
    return;
  }

  try {
    await axios.post("/api/orders/updateIstickDONE", {
      orders: filteredList.map((o) => ({
        id: o.id,
        istickDONE: true,
      })),
    });

    showToast(`Đã chuyển ${filteredList.length} đơn sang Giao thành công ✓`);

    fetchOrders();

    setTimeout(() => {
      setCurrentView("done");
    }, 700);

  } catch (err) {
    console.error(err);
    showToast("Lỗi khi cập nhật Giao thành công");
  }
}

  // ── Tick tất cả Đối soát ──
async function tickAllReconcile() {
  if (!filteredList.length) {
    showToast("Không có đơn nào");
    return;
  }

  try {
    await axios.post("/api/orders/updateReconciled", {
      orders: filteredList.map((o) => ({
        id: o.id,
        reconciled: true,
      })),
    });

    showToast(`Đã chuyển ${filteredList.length} đơn sang Đối soát ✓`);

    fetchOrders();

    setTimeout(() => {
      setCurrentView("reconcile");
    }, 700);

  } catch (err) {
    console.error(err);
    showToast("Lỗi khi cập nhật Đối soát");
  }
}

  // ── Bulk deliver ──
async function bulkDeliver() {
  const sel = filteredList.filter((o) => selectedIds.has(o.id));

  if (!sel.length) {
    showToast("Chưa chọn đơn nào");
    return;
  }

  try {
    await axios.post("/api/orders/updateIstickDONE", {
      orders: sel.map((o) => ({
        id: o.id,
        istickDONE: true,
      })),
    });

    showToast(`Đã chuyển ${sel.length} đơn sang Giao thành công ✓`);

    clearSelection();
    fetchOrders();

    setTimeout(() => setCurrentView("done"), 700);
  } catch (err) {
    console.error(err);
    showToast("Lỗi khi cập nhật Giao thành công");
  }
}

  // ── Bulk reconcile ──
  async function bulkReconcile() {
  const sel = filteredList.filter((o) => selectedIds.has(o.id));

  if (!sel.length) {
    showToast("Chưa chọn đơn nào");
    return;
  }

  try {
    await axios.post("/api/orders/updateReconciled", {
      orders: sel.map((o) => ({
        id: o.id,
        reconciled: true,
      })),
    });

    showToast(`Đã chuyển ${sel.length} đơn sang Đối soát ✓`);

    clearSelection();

    await fetchOrders();

    setTimeout(() => {
      setCurrentView("reconcile");
    }, 700);

  } catch (err) {
    console.error("Lỗi updateReconciled:", err);
    showToast("Lỗi khi cập nhật Đối soát");
  }
}

  // ── Bulk unreconcile ──
  async function bulkUnreconcile() {
  const sel = filteredList.filter((o) => selectedIds.has(o.id));

  if (!sel.length) {
    showToast("Chưa chọn đơn nào");
    return;
  }

  try {
    await axios.post("/api/orders/updateReconciled", {
      orders: sel.map((o) => ({
        id: o.id,
        reconciled: false,
      })),
    });

    showToast(`Đã bỏ đối soát ${sel.length} đơn ✓`);

    clearSelection();

    await fetchOrders();

    setTimeout(() => {
      setCurrentView("done");
    }, 700);

  } catch (err) {
    console.error("Lỗi updateReconciled:", err);
    showToast("Lỗi khi bỏ đối soát");
  }
}
  // ── Prod filter ──
  function toggleProd(prod) {
    setActiveProds((prev) => {
      const next = new Set(prev);
      next.has(prod) ? next.delete(prod) : next.add(prod);
      return next;
    });
  }

  function clearProdFilter() {
    setActiveProds(new Set());
    setProdSearch("");
  }

  // ── Ghép mã VĐ (parse) ──
  function parsePairs() {
    const stts = bulkStt.trim().split("\n").map((s) => s.trim()).filter(Boolean);
    const tracks = bulkTrack.trim().split("\n").map((s) => s.trim()).filter(Boolean);
    if (!stts.length && tracks.length) return { mode: "order", tracks };
    const pairs = [];
    for (let i = 0; i < Math.min(stts.length, tracks.length); i++) {
      pairs.push({ stt: parseInt(stts[i]), track: tracks[i] });
    }
    return { mode: "pair", pairs };
  }

  function previewMatch() {
    const r = parsePairs();
    if (r.mode === "order") { setMatchPreview(null); return; }
    setMatchPreview(r.pairs.map((p) => {
      const o = orders.find((x) => x.stt === p.stt);
      return { stt: p.stt, track: p.track, found: !!o, cust: o?.cust || "" };
    }));
  }

  async function applyBulkTrack() {
    const r = parsePairs();
    let matched = 0, notFound = 0;

    if (r.mode === "pair") {
      // Cập nhật local state
      const updates = [];
      r.pairs.forEach((p) => {
        const o = orders.find((x) => x.stt === p.stt);
        if (o) { matched++; updates.push({ stt: p.stt, trackingCode: p.track }); }
        else notFound++;
      });
      // Gọi API batch update tracking
      try {
        await axios.post("/api/orders/batch-update-tracking", { updates });
        setTrackNote(`✓ Ghép ${matched} mã${notFound ? ` · ${notFound} STT không tìm thấy` : ""}`);
        showToast(`Ghép ${matched} mã thành công`);
        fetchOrders();
      } catch (err) {
        console.error(err);
        showToast("Lỗi khi ghép mã");
      }
    } else {
      // Mode: dán chỉ mã, ghép theo thứ tự đơn chưa có mã
      const noTrack = orders.filter((o) => !o.track);
      const updates = r.tracks
        .slice(0, noTrack.length)
        .map((code, i) => ({ stt: noTrack[i].stt, trackingCode: code }));
      matched = updates.length;
      try {
        await axios.post("/api/orders/batch-update-tracking", { updates });
        setTrackNote(`✓ Ghép ${matched} mã vào đơn chưa có mã`);
        showToast(`Ghép ${matched} mã thành công`);
        fetchOrders();
      } catch (err) {
        console.error(err);
        showToast("Lỗi khi ghép mã");
      }
    }
    setMatchPreview(null);
  }

  function clearBulkInputs() {
    setBulkStt(""); setBulkTrack(""); setTrackNote(""); setMatchPreview(null);
  }

  // ── Inline set track (single) ──
  async function setTrack(id, val) {
    val = val.trim();
    if (!val) return;
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    try {
      await axios.post("/api/orders/batch-update-tracking", {
        updates: [{ stt: o.stt, trackingCode: val }],
      });
      showToast("Đã lưu mã: " + val);
      fetchOrders();
    } catch (err) {
      showToast("Lỗi khi lưu mã");
    }
  }

  // ── Export Excel (CSV) ──
  function exportExcel() {
    if (!filteredList.length) { showToast("Không có đơn nào để xuất"); return; }
    const headers = ["STT","Tên khách","SĐT","Địa chỉ","Sản phẩm","Số lượng","Quà","Ngày đặt","Ngày gửi","Ngày nhận","Mã vận đơn","Tình trạng"];
    const rows = filteredList.map((o) => [
      o.stt, o.cust, o.sdt,
      o.addr.startsWith("http") ?  o.addr : o.addr,
      o.prods.join(" | "), o.qty.join(" | "), o.qua || "",
      o.ngayDat || "", o.ngayGui || "", o.ngayNhan || "", o.track || "",
      o.reconciled ? "Đối soát" : o.delivered ? "Giao TC" : o.ngayGui ? "Đang giao" : "Chưa gửi",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    a.href = url; a.download = `Don_kho_${VIEW_CFG[currentView].title.replace(/ /g, "_")}_${d}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast(`✓ Đã xuất ${filteredList.length} đơn ra file CSV`);
  }

  async function exportExcelUnsent() {
    const sel = filteredList.filter((o) => selectedIds.has(o.id));
    const toExport = sel.length > 0 ? sel : filteredList;
    if (!toExport.length) { showToast("Không có đơn nào để xuất"); return; }

    // ── 1. Xuất file CSV ──
    const headers = ["STT","Tên khách","SĐT","Địa chỉ","Sản phẩm","Số lượng","Quà","Ngày đặt","Mã vận đơn"];
    const rows = toExport.map((o) => [
      o.stt, o.cust, o.sdt,
      o.addr.startsWith("http") ?  o.addr : o.addr,
      o.prods.join(" | "), o.qty.join(" | "), o.qua || "", o.ngayDat || "", o.track || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    a.href = url; a.download = `Don_kho_chua_gui_${d}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);

    // ── 2. Gọi API cập nhật shippingDate1 (ngày gửi) cho các đơn chưa có ngày gửi ──
    const todayISO = dayjs().format("YYYY-MM-DD");
    const ordersToMarkSent = toExport.filter((o) => !o.ngayGui); // chỉ cập nhật đơn chưa có ngày gửi
    if (ordersToMarkSent.length > 0) {
      try {
        await axios.post("/api/orders/updateIstickkhohq", {
          orders: ordersToMarkSent.map((o) => ({
            
            stt: o.stt,
            shippingDate1: todayISO,
          })),
        });
        showToast(`✓ Đã xuất ${toExport.length} đơn & chuyển ${ordersToMarkSent.length} đơn sang Đã gửi hàng`);
      } catch (err) {
        console.error("Lỗi khi cập nhật ngày gửi:", err);
        showToast(`✓ Đã xuất file nhưng lỗi khi cập nhật ngày gửi`);
      }
      // Fetch lại để UI đồng bộ với backend
      fetchOrders();
    } else {
      showToast(`✓ Đã xuất ${toExport.length} đơn`);
    }

    clearSelection();
    setTimeout(() => setCurrentView("sent"), 700);
  }

  // ── Calc stats cho selected ──
  const selStats = useMemo(() => {
    const sel = filteredList.filter((o) => selectedIds.has(o.id));
    const spMap = {};
    let totalQua = 0;
    sel.forEach((o) => {
      o.prods.forEach((p, i) => { spMap[p] = (spMap[p] || 0) + (o.qty[i] || 1); });
      totalQua += Number(o.qua) || 0;
    });
    return { spMap, totalQua };
  }, [filteredList, selectedIds]);

  // ── Flow hint step ──
  const flowActiveIdx = { unsent: 0, all: -1, sent: 2, late: 3, done: 3, reconcile: 4 }[currentView] ?? -1;

  // ── Master checkbox state ──
  const allIds = filteredList.map((o) => o.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id));

  const isImg = (s) => s && (s.startsWith("http://") || s.startsWith("https://"));
  const showRec = currentView === "done" || currentView === "reconcile";

  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */
  return (
    <>
      <style>{CSS}</style>
      <div className="kho-root">

        {/* ── Loading overlay ── */}
        {loading && (
          <div className="kho-loading">
            <div className="kho-spinner" />
            <p>Đang tải đơn hàng…</p>
          </div>
        )}

        {/* ═══ SIDEBAR ═══ */}
        <aside className="sb">
          <div className="brand">
            <div className="ico">HQ</div>
            <div>
              <div className="nm">KHOHQ1</div>
              <div className="sub">Quản lý đơn hàng</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nl">Đơn hàng</div>
            {VIEWS.map((v) => {
              const cfg = VIEW_CFG[v];
              const vcls = `ni v-${v}${currentView === v ? " on" : ""}`;
              return (
                <button key={v} className={vcls} onClick={() => { setCurrentView(v); clearSelection(); }}>
                  <ViewIcon view={v} />
                  {cfg.title.split("–")[0].trim()} {v === "late" && "– Cần check"}
                  <span className="pill">{pillCounts[v]}</span>
                </button>
              );
            })}

            <div className="nl">Thao tác nhanh</div>
            <div className="sb-qa">
              <button className="qa-btn" onClick={() => { fetchOrders(); showToast("Đã tải lại"); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 4v4h-4" /></svg>
                Tải lại đơn hàng
              </button>
              <button className="qa-btn" onClick={() => { setCurrentView("unsent"); clearSelection(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10H3M21 6H3M21 14H3M21 18H3" /></svg>
                Đến Chưa gửi hàng
              </button>
              <button className="qa-btn" onClick={() => { setCurrentView("sent"); clearSelection(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                Đến Đã gửi hàng
              </button>
              <button className="qa-btn" onClick={() => { setCurrentView("late"); clearSelection(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                Xem đơn giao lâu
              </button>
              <button className="qa-btn" onClick={clearSelection}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12" /></svg>
                Bỏ chọn tất cả
              </button>
            </div>
          </nav>

          <div className="sbf">
            <button className="qa-btn danger" style={{ width: "100%", padding: "8px 10px", borderRadius: 8 }}
              onClick={() => router.push("/login")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
              Đăng xuất
            </button>
            <div className="ver">v5.0 · KHOHQ1</div>
          </div>
        </aside>

        {/* ═══ MAIN ═══ */}
        <div className="main">
          {/* Topbar */}
          <header className="topbar">
            <div className="pt">
              <span>{VIEW_CFG[currentView].title}</span>
              <small>{VIEW_CFG[currentView].sub} · {dayjs().format("DD/MM/YYYY")}</small>
            </div>
            <div className={`view-badge ${VIEW_CFG[currentView].badgeCls}`}>
              {VIEW_CFG[currentView].badge}
            </div>
            <div className="srch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="Tìm tên khách, SĐT, mã vận đơn…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>
            <div className="tbr">
              <div className="cnt">SL ĐƠN: <b>{filteredList.length}</b></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="av">{currentUser?.name?.[0] || "K"}</div>
                <div>
                  <div className="uname">{currentUser?.name || "Nhân viên kho"}</div>
                  <div className="urole">Nhân viên kho</div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="content">

            {/* Step flow */}
            {/* <div className="flow-hint">
              {[
                "Lọc SP & Xuất Excel",
                "Đóng hàng",
                "Nhập mã VĐ hàng loạt",
                "7-10 ngày → Tích Giao TC",
                "Đối soát",
              ].map((label, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="flow-arrow">›</div>}
                  <div className={`flow-step${flowActiveIdx === i ? " active" : ""}`}>
                    <span className="snum">{i + 1}</span>{label}
                  </div>
                </React.Fragment>
              ))}
            </div> */}

            {/* Tool panels */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              {/* Panel 1: Lọc SP */}
              <div className="tool-panel">
                <div className={`tp-head${p1collapsed ? " collapsed" : ""}`} onClick={() => setP1collapsed((v) => !v)}>
                  <div className="tph-ico tph-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                  </div>
                  <div>
                    <h3>Lọc sản phẩm</h3>
                    <p>
                      {activeProds.size > 0
                        ? `Đang lọc: ${[...activeProds].join(", ")} — ${filteredList.length} đơn`
                        : "Chọn SP → lọc bảng → xuất Excel"}
                    </p>
                  </div>
                  <div className="chevron">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                <div className={`tp-body${p1collapsed ? " hidden" : ""}`}>
                  <div className="prod-search-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    <input
                      type="text"
                      placeholder="Tìm sản phẩm…"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                    />
                  </div>

                  <div className="prod-chips">
                    {filteredProdChips.map((p) => {
                      const cnt = viewList.filter((o) => o.prods.includes(p)).length;
                      return (
                        <button
                          key={p}
                          className={`pchip${activeProds.has(p) ? " sel" : ""}`}
                          onClick={() => toggleProd(p)}
                        >
                          {p}
                          <span style={{ opacity: 0.6, fontSize: 10 }}>({cnt})</span>
                        </button>
                      );
                    })}
                    {filteredProdChips.length === 0 && (
                      <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Không có sản phẩm</span>
                    )}
                  </div>

                  {activeProds.size > 0 && (
                    <div className="sp-summary show">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: "var(--accent)", strokeWidth: 2, flexShrink: 0 }}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                      <span style={{ flex: 1, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {[...activeProds].map((p) => <span key={p} className="sp-tag">{p}</span>)}
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>{filteredList.length} đơn</span>
                      <button onClick={clearProdFilter} style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600 }}>✕</button>
                    </div>
                  )}

                  <div className="panel-actions">
                    <button className="btn btn-ghost btn-sm" onClick={clearProdFilter}>Bỏ lọc</button>
                    <button className="btn btn-sec btn-sm" onClick={() => {
                      filteredList.forEach((o) => setSelectedIds((prev) => new Set([...prev, o.id])));
                      showToast(`Đã chọn ${filteredList.length} đơn`);
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg>
                      Chọn tất cả
                    </button>
                    {/* <button className="btn btn-pri btn-sm" onClick={exportExcelUnsent}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      Xuất Excel
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Panel 2: Ghép mã VĐ */}
              <div className="tool-panel">
                <div className={`tp-head${p2collapsed ? " collapsed" : ""}`} onClick={() => setP2collapsed((v) => !v)}>
                  <div className="tph-ico tph-purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8zM5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM17 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /></svg>
                  </div>
                  <div>
                    <h3>Ghép mã vận đơn hàng loạt</h3>
                    <p>Dán STT trái · Mã phải → tự đối chiếu</p>
                  </div>
                  <div className="chevron">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                <div className={`tp-body${p2collapsed ? " hidden" : ""}`}>
                  <div className="dual-paste">
                    <div className="dp-col">
                      <label>STT đơn hàng</label>
                      <textarea
                        placeholder={"28792\n28742\n28499"}
                        value={bulkStt}
                        onChange={(e) => setBulkStt(e.target.value)}
                      />
                    </div>
                    <div className="dp-col">
                      <label>Mã vận đơn</label>
                      <textarea
                        placeholder={"44413913703\n44413913714\n44413913725"}
                        value={bulkTrack}
                        onChange={(e) => setBulkTrack(e.target.value)}
                      />
                    </div>
                  </div>

                  {matchPreview && (
                    <div className="match-preview">
                      <div className="mp-head">Kết quả đối chiếu</div>
                      <div className="mp-list">
                        {matchPreview.map((p, i) => (
                          <div key={i} className="mp-row">
                            <span className={p.found ? "match-ok" : "match-err"}>{p.found ? "✓" : "✗"}</span>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--ink2)", minWidth: 52 }}>{p.stt}</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: "var(--muted)" }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            <span style={{ fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>{p.track}</span>
                            <span style={{ color: "var(--muted)", fontSize: 10.5 }}>{p.found ? "— " + p.cust : "— Không tìm thấy"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="panel-actions">
                    <button className="btn btn-ghost btn-sm" onClick={previewMatch}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                      Xem trước
                    </button>
                    <button className="btn btn-pri btn-sm" onClick={applyBulkTrack}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      Ghép vào đơn
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={clearBulkInputs}>Xóa</button>
                  </div>
                  {trackNote && <div className="track-note">{trackNote}</div>}
                </div>
              </div>

            </div>

            {/* TABLE CARD */}
            <div className="tcard">
              <div className="ch">
                <div>
                  <h2>{VIEW_CFG[currentView].title}</h2>
                  <small>Hiển thị <span>{filteredList.length}</span> đơn</small>
                </div>
                {/* Action buttons theo view */}
                <div className="btn-row">
                  {currentView === "all" && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { fetchOrders(); showToast("Đã tải lại"); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 4v4h-4" /></svg>
                      Tải lại
                    </button>
                  )}
                  {currentView === "unsent" && (
                    <>
                      <button className="btn btn-amber btn-sm" onClick={() => setCurrentView("sent")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        Xem Đã gửi
                      </button>
                      <button className="btn btn-pri btn-sm" onClick={exportExcelUnsent}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                        Xuất Excel
                      </button>
                    </>
                  )}
                  {currentView === "sent" && (
                    <>
                      <button className="btn btn-red btn-sm" onClick={() => setCurrentView("late")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        Xem giao lâu ({pillCounts.late})
                      </button>
                      <button className="btn btn-green btn-sm" onClick={tickAllDelivered}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>
                        Tích tất cả Giao TC
                      </button>
                      <button className="btn btn-pri btn-sm" onClick={exportExcel}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                        Xuất Excel
                      </button>
                    </>
                  )}
                  {currentView === "late" && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => setCurrentView("sent")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Quay lại Đã gửi
                      </button>
                      <button className="btn btn-pri btn-sm" onClick={exportExcel}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                        Xuất danh sách cần check
                      </button>
                    </>
                  )}
                  {currentView === "done" && (
                    <>
                      <button className="btn btn-purple btn-sm" onClick={tickAllReconcile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4" /></svg>
                        Tích tất cả Đối soát
                      </button>
                      <button className="btn btn-pri btn-sm" onClick={exportExcel}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                        Xuất Excel
                      </button>
                    </>
                  )}
                  {currentView === "reconcile" && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={bulkUnreconcile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Bỏ đối soát đã chọn
                      </button>
                      <button className="btn btn-pri btn-sm" onClick={exportExcel}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                        Xuất đối soát Excel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 34, textAlign: "center" }}>
                        <button
                          className={`master-cbx${allSelected ? " on" : someSelected ? " partial" : ""}`}
                          onClick={toggleMaster}
                        >
                          {CHK}
                        </button>
                      </th>
                      <th style={{ width: 32 }}></th>
                      <th style={{ textAlign: "center" }}>Giao TC</th>
                      {showRec && <th style={{ textAlign: "center" }}>Đối soát</th>}
                      <th>Mã vận đơn</th>
                      <th>Tình trạng</th>
                      <th>Sản phẩm</th>
                      <th>STT</th>
                      <th>Tên khách</th>
                      <th>SĐT</th>
                      <th>Địa chỉ</th>
                      <th>Quà</th>
                      <th>Ngày đặt</th>
                      <th>Ngày gửi</th>
                      <th>Ngày nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={showRec ? 16 : 15}>
                          <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
                            </svg>
                            <p>Không có đơn hàng nào.</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredList.map((o) => {
                      const late = isLate(o);
                      const isDelivered = deliveredIds.has(o.id) || o.delivered;
                      const isReconciled = reconciledIds.has(o.id) || o.reconciled;

                      let dispSt;
                      if (isReconciled)       dispSt = { cls: "rec-c",    label: "ĐỐI SOÁT" };
                      else if (isDelivered)   dispSt = { cls: "done-c",   label: "GIAO TC" };
                      else if (late)          dispSt = { cls: "late-c",   label: `GIAO LÂU ${o.daysShipping}N` };
                      else if (o.ngayGui)     dispSt = { cls: "ship-c",   label: "ĐANG GIAO" };
                      else                    dispSt = { cls: "unsent-c", label: "CHƯA GỬI" };

                      return (
                        <tr key={o.id} className={late && !isDelivered ? "late-row" : ""}>
                          {/* Checkbox chọn */}
                          <td className="ctr">
                            <button
                              className={`cbx${selectedIds.has(o.id) ? " on" : ""}`}
                              onClick={() => toggleSelect(o.id)}
                            >
                              {CHK}
                            </button>
                          </td>
                          {/* Edit */}
                          <td>
                            <button className="edit-btn" title="Sửa đơn">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                          </td>
                          {/* Giao TC */}
                          <td className="ctr">
                            <button
                              className={`cbx${isDelivered ? " on-g" : ""}`}
                              onClick={() => toggleDelivered(o.id)}
                            >
                              {CHK}
                            </button>
                          </td>
                          {/* Đối soát */}
                          {showRec && (
                            <td className="ctr">
                              <button
                                className={`cbx${isReconciled ? " on-p" : ""}`}
                                onClick={() => toggleReconciled(o.id)}
                              >
                                {CHK}
                              </button>
                            </td>
                          )}
                          {/* Mã VĐ */}
                          <td>
                            {o.track
                              ? <span className="track-txt">{o.track}</span>
                              : <input
                                  className="tinput"
                                  placeholder="Nhập mã…"
                                  onBlur={(e) => setTrack(o.id, e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && setTrack(o.id, e.target.value)}
                                />
                            }
                            {late && !isDelivered && (
                              <span className="late-badge" style={{ marginLeft: 6 }}>⚠ {o.daysShipping}N</span>
                            )}
                          </td>
                          {/* Tình trạng */}
                          <td>
                            <span className={`chip ${dispSt.cls}`}>
                              <span className="dot" />
                              {dispSt.label}
                            </span>
                          </td>
                          {/* Sản phẩm */}
                          <td>
                            <div className="prods">
                              {o.prods.map((p, i) => (
                                <div key={i} className={`ptag${activeProds.has(p) ? " hi" : ""}`}>
                                  {p} <span className="sl">×{o.qty[i] || 1}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td><span className="stt-n">{o.stt}</span></td>
                          <td><span className="cust">{o.cust}</span></td>
                          <td><span className="phone">{o.sdt}</span></td>
                          <td>
                            {isImg(o.addr)
                              ? <img className="addr-thumb" src={o.addr} alt="" loading="lazy"
                                  onError={(e) => e.target.style.display = "none"} />
                              : <span style={{ fontSize: 11, color: "var(--ink2)", maxWidth: 110, display: "block", lineHeight: 1.5 }}>{o.addr}</span>
                            }
                          </td>
                          <td>
                            {o.qua
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#fff3e0", color: "#e67e00", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5 }}>🎁 {o.qua}</span>
                              : "-"}
                          </td>
                          <td style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{o.ngayDat || "-"}</td>
                          <td style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{o.ngayGui || "-"}</td>
                          <td style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{o.ngayNhan || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save bar */}
              <div className="sb-bar">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="sel">Đã chọn: <b>{selectedCount}</b> đơn</span>
                  {/* Stat pills cho selected */}
                  {selectedCount > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(selStats.spMap).map(([p, n]) => (
                        <span key={p} className="stat-pill sp-blue">
                          {p.replace("DD VỆ SINH NỮ - ", "")}: <b>{n}</b>
                        </span>
                      ))}
                      {selStats.totalQua > 0 && (
                        <span className="stat-pill sp-amber">🎁 Quà: <b>{selStats.totalQua}</b></span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {/* {(currentView === "all" || currentView === "sent" || currentView === "late") && (
                    <button className="btn btn-green btn-sm" onClick={saveDelivered}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg>
                      Lưu Giao TC
                    </button>
                  )} */}
                  {currentView === "unsent" && (
                    <button className="btn btn-pri btn-sm" onClick={exportExcelUnsent}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      Xuất Excel
                    </button>
                  )}
                  {/* {currentView === "done" && (
                    <button className="btn btn-purple btn-sm" onClick={saveReconcile}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4" /></svg>
                      Lưu & chuyển sang Đối soát
                    </button>
                  )} */}
                  {/* {currentView === "reconcile" && (
                    <button className="btn btn-pri btn-sm" onClick={exportExcel}>Xuất Excel đối soát</button>
                  )} */}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* ═══ BULK FLOAT BAR ═══ */}
        <div className={`bulk-bar${selectedCount > 0 ? " show" : ""}`}>
          <div className="bulk-count">
            <span>Đã chọn</span>
            <span className="n">{selectedCount}</span>
            <span>đơn</span>
          </div>
          {/* Bulk stats */}
          {selectedCount > 0 && (
            <div style={{ display: "flex", gap: 6, paddingRight: 8, borderRight: "1px solid #2a3a5a", marginRight: 2 }}>
              {Object.entries(selStats.spMap).map(([p, n]) => (
                <span key={p} className="stat-pill sp-blue" style={{ fontSize: 11 }}>
                  {p.replace("DD VỆ SINH NỮ - ", "")}: <b>{n}</b>
                </span>
              ))}
              {selStats.totalQua > 0 && (
                <span className="stat-pill sp-amber" style={{ fontSize: 11 }}>🎁 <b>{selStats.totalQua}</b></span>
              )}
            </div>
          )}
          <div className="bulk-actions">
            {(currentView === "all" || currentView === "sent" || currentView === "late") && (
              <button className="bb bb-green" onClick={bulkDeliver}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg>
                Tích Giao TC ({selectedCount})
              </button>
            )}
            {currentView === "unsent" && (
              <button className="bb bb-blue" onClick={exportExcelUnsent}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                Xuất Excel ({selectedCount})
              </button>
            )}
            {currentView === "done" && (
              <button className="bb bb-purple" onClick={bulkReconcile}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4" /></svg>
                Đối soát ({selectedCount})
              </button>
            )}
            {currentView === "reconcile" && (
              <button className="bb bb-ghost" onClick={bulkUnreconcile}>
                Bỏ đối soát ({selectedCount})
              </button>
            )}
          </div>
          <button className="bulk-close" onClick={clearSelection}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ═══ TOAST ═══ */}
        <div className={`kho-toast${toast.show ? " show" : ""}`}>{toast.msg}</div>

      </div>
    </>
  );
}

/* ─── Icon helper ─── */
function ViewIcon({ view }) {
  switch (view) {
    case "all":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
    case "unsent":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg>;
    case "sent":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "late":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    case "done":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>;
    case "reconcile":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    default:
      return null;
  }
}
