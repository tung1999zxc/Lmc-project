"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Modal,
  Input,
  Select,
  Switch,
  Checkbox,
  message,
  Popconfirm,
} from "antd";

const { TextArea } = Input;
const { Option } = Select;

/* ====================== RICH-TEXT EDITOR ====================== */
/**
 * Editor nhập liệu như Word: gõ chữ bình thường, dùng nút B/I/U để định dạng.
 * - Nội dung lưu trong state.value là HTML (tương thích DB & hiển thị nội quy).
 * - Dùng contentEditable + document.execCommand để không cần cài thêm thư viện.
 */
function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung..." }) {
  const editorRef = useRef(null);
  const lastHtmlRef = useRef("");

  // Đồng bộ giá trị từ prop vào DOM (chỉ khi HTML thực sự khác)
  useEffect(() => {
    if (!editorRef.current) return;
    const incoming = value || "";
    if (incoming !== lastHtmlRef.current) {
      editorRef.current.innerHTML = incoming;
      lastHtmlRef.current = incoming;
    }
  }, [value]);

  const exec = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastHtmlRef.current = html;
    onChange(html);
  };

  const handlePaste = (e) => {
    // Dán thuần text để không mang theo style rác từ Word/Google Docs
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Các nút toolbar
  const tools = [
    { key: "bold", label: <strong>B</strong>, title: "In đậm (Ctrl+B)", style: { width: 32 } },
    { key: "italic", label: <em>I</em>, title: "In nghiêng (Ctrl+I)", style: { width: 32 } },
    { key: "underline", label: <u>U</u>, title: "Gạch chân (Ctrl+U)", style: { width: 32 } },
    { divider: true },
    { key: "formatBlock-h4", label: <strong>H</strong>, title: "Tiêu đề", cmd: "formatBlock", arg: "h4", style: { width: 32 } },
    { key: "formatBlock-p", label: <span style={{ fontSize: 13 }}>¶</span>, title: "Đoạn văn", cmd: "formatBlock", arg: "p", style: { width: 32 } },
    { divider: true },
    { key: "insertUnorderedList", label: "•", title: "Danh sách dấu đầu dòng", style: { width: 32 } },
    { key: "insertOrderedList", label: "1.", title: "Danh sách số", style: { width: 32 } },
    { divider: true },
    { key: "justifyLeft", label: "⬅", title: "Căn trái", style: { width: 32 } },
    { key: "justifyCenter", label: "↔", title: "Căn giữa", style: { width: 32 } },
    { key: "justifyRight", label: "➡", title: "Căn phải", style: { width: 32 } },
    { divider: true },
    { key: "undo", label: "↶", title: "Hoàn tác (Ctrl+Z)", style: { width: 32 } },
    { key: "redo", label: "↷", title: "Làm lại (Ctrl+Y)", style: { width: 32 } },
    { divider: true },
    { key: "removeFormat", label: "Tx", title: "Xoá định dạng", style: { width: 36, fontSize: 12 } },
  ];

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar">
        {tools.map((t, idx) =>
          t.divider ? (
            <div key={`d${idx}`} className="rte-divider" />
          ) : (
            <button
              key={t.key}
              type="button"
              className="rte-btn"
              title={t.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(t.cmd || t.key, t.arg)}
              style={t.style}
            >
              {t.label}
            </button>
          )
        )}
      </div>
      <div
        ref={editorRef}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
      />
      <style jsx global>{`
        .rte-wrapper {
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          background: #fff;
          transition: border-color 0.2s;
        }
        .rte-wrapper:focus-within {
          border-color: #1677ff;
          box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
        }
        .rte-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-bottom: 1px solid #f0f0f0;
          background: #fafafa;
          border-radius: 6px 6px 0 0;
        }
        .rte-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 30px;
          height: 30px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 4px;
          background: transparent;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rte-btn:hover {
          background: #fff;
          border-color: #d9d9d9;
        }
        .rte-btn:active {
          background: #e6f4ff;
        }
        .rte-divider {
          width: 1px;
          height: 18px;
          background: #e8e8e8;
          margin: 0 4px;
        }
        .rte-content {
          min-height: 200px;
          max-height: 480px;
          overflow-y: auto;
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.7;
          color: #222;
          outline: none;
        }
        .rte-content:empty::before {
          content: attr(data-placeholder);
          color: #bfbfbf;
          pointer-events: none;
        }
        .rte-content h4 {
          margin: 8px 0 6px;
          font-size: 16px;
          font-weight: 600;
        }
        .rte-content p {
          margin: 4px 0;
        }
        .rte-content ul,
        .rte-content ol {
          padding-left: 22px;
          margin: 4px 0;
        }
        .rte-content li {
          margin: 2px 0;
        }
      `}</style>
    </div>
  );
}

/* ====================== HẰNG SỐ & NHÃN ====================== */
const CATEGORIES = [
  { value: "general", label: "Quy định chung", icon: "🏢" },
  { value: "work", label: "Quy định công việc", icon: "💼" },
  { value: "time", label: "Giờ giấc & chấm công", icon: "⏰" },
  { value: "security", label: "Bảo mật & tài sản", icon: "🔐" },
  { value: "discipline", label: "Kỷ luật & xử lý vi phạm", icon: "⚠️" },
];

const COLORS = [
  { value: "red", label: "Đỏ (Quan trọng)" },
  { value: "yellow", label: "Vàng (Lưu ý)" },
  { value: "green", label: "Xanh (Bình thường)" },
];

const CAT_LABEL = (v) =>
  CATEGORIES.find((c) => c.value === v)?.label || v;
const CAT_ICON = (v) =>
  CATEGORIES.find((c) => c.value === v)?.icon || "📌";
const COLOR_NAME = (v) =>
  COLORS.find((c) => c.value === v)?.label || v;

/* ====================== COMPONENT CHÍNH ====================== */
export default function RulesCompanyPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser);

  // Quyền: chỉ admin (và 1 số vị trí quản lý) mới được CRUD
  const canManage = useMemo(() => {
    const p = currentUser?.position || "";
    return (
      p === "admin" ||
      p === "managerSALE" ||
      p === "managerMKT" ||
      p === "leadSALE" ||
      currentUser?.name === "Hoàng Kim Tùng"
    );
  }, [currentUser]);

  // userKey dùng để lưu xác nhận đã đọc.
  // Ưu tiên: employee_code > username > name > 'anonymous'.
  // Tránh trả về "" vì API sẽ báo "Thiếu userKey".
  const userKey = useMemo(() => {
    if (!currentUser) return "";
    const candidates = [
      currentUser.employee_code,
      currentUser.username,
      currentUser.name,
    ];
    for (const v of candidates) {
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
    return "anonymous";
  }, [currentUser]);

  const userName = currentUser?.name || currentUser?.username || "Người dùng";

  /* ---------- State ---------- */
  const [rules, setRules] = useState([]);
  const [readMap, setReadMap] = useState({}); // { ruleId: readAt }
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [activeNav, setActiveNav] = useState("all");

  // Modal xem chi tiết (cho mọi user)
  const [viewRule, setViewRule] = useState(null);

  // Modal CRUD (chỉ admin)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = thêm mới
  const [form, setForm] = useState({
    cat: "general",
    title: "",
    desc: "",
    tag: "NỘI QUY",
    color: "green",
    body: "",
    important: false,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  /* ---------- Auth guard ---------- */
  useEffect(() => {
    if (!currentUser || !currentUser.name) {
      router.push("/login");
    }
  }, [currentUser, router]);

  /* ---------- Load dữ liệu ---------- */
  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/rulesCompany");
      setRules(res.data?.data || []);
    } catch (err) {
      console.error(err);
      messageApi.error(
        err.response?.data?.error || "Lỗi khi tải danh sách nội quy"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAcks = async () => {
    if (!userKey) return;
    try {
      const res = await axios.get("/api/rulesCompany/acks", {
        params: { userKey },
      });
      const map = {};
      (res.data?.data || []).forEach((a) => {
        map[a.ruleId] = a.readAt;
      });
      setReadMap(map);
    } catch (err) {
      console.error("Lỗi tải xác nhận đã đọc:", err);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userKey) fetchAcks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  /* ---------- Tính toán hiển thị ---------- */
  const filteredRules = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rules
      .filter((r) => r.active !== false) // mặc định chỉ hiện active
      .filter((r) => {
        const matchQ =
          !q ||
          `${r.title} ${r.desc || ""} ${r.tag || ""}`
            .toLowerCase()
            .includes(q);
        const matchCat = category === "all" || r.cat === category;
        const isRead = Boolean(readMap[r.id]);
        const matchStatus =
          status === "all" ||
          (status === "read" && isRead) ||
          (status === "unread" && !isRead);
        return matchQ && matchCat && matchStatus;
      })
      .sort((a, b) => (a.order || a.id) - (b.order || b.id));
  }, [rules, search, category, status, readMap]);

  const totalRules = rules.filter((r) => r.active !== false).length;
  const readCount = rules.filter(
    (r) => r.active !== false && readMap[r.id]
  ).length;
  const unreadCount = totalRules - readCount;
  const importantCount = rules.filter(
    (r) => r.active !== false && (r.important || r.color === "red")
  ).length;
  const percent =
    totalRules > 0 ? Math.round((readCount / totalRules) * 100) : 0;

  const importantList = useMemo(
    () =>
      rules
        .filter(
          (r) => r.active !== false && (r.important || r.color === "red")
        )
        .slice(0, 5),
    [rules]
  );

  /* ---------- Hành động: xác nhận đã đọc ---------- */
  async function ackRule(ruleId) {
    if (!userKey) {
      messageApi.warning("Vui lòng đăng nhập để xác nhận đã đọc");
      return;
    }
    try {
      console.log("[ackRule] gọi API với", { ruleId, userKey, userName });
      const res = await axios.post(`/api/rulesCompany/ack/${ruleId}`, {
        userKey,
        userName,
      });
      console.log("[ackRule] response:", res.data);
      setReadMap((m) => ({ ...m, [ruleId]: new Date() }));
      messageApi.success("Đã xác nhận đã đọc");
    } catch (err) {
      console.error("[ackRule] lỗi:", err);
      console.error("[ackRule] response data:", err.response?.data);
      console.error("[ackRule] response status:", err.response?.status);
      const serverMsg =
        err.response?.data?.error || err.message || "Lỗi không xác định";
      messageApi.error(`Không thể xác nhận đã đọc: ${serverMsg}`);
    }
  }

  async function markAllRead() {
    if (!userKey) {
      messageApi.warning("Vui lòng đăng nhập để sử dụng chức năng này");
      return;
    }
    try {
      await axios.post("/api/rulesCompany/ack-all", { userKey, userName });
      const now = new Date();
      const m = { ...readMap };
      rules.forEach((r) => {
        if (r.active !== false) m[r.id] = now;
      });
      setReadMap(m);
      messageApi.success("Đã đánh dấu đã đọc tất cả nội quy");
    } catch (err) {
      console.error("[markAllRead] lỗi:", err);
      console.error("[markAllRead] response:", err.response?.data);
      const serverMsg =
        err.response?.data?.error || err.message || "Lỗi không xác định";
      messageApi.error(`Không thể đánh dấu tất cả: ${serverMsg}`);
    }
  }

  /* ---------- Hành động: CRUD admin ---------- */
  function openCreate() {
    setEditingId(null);
    setForm({
      cat: activeNav !== "all" ? activeNav : "general",
      title: "",
      desc: "",
      tag: "NỘI QUY",
      color: "green",
      body: "",
      important: false,
      active: true,
    });
    setFormOpen(true);
  }

  function openEdit(rule) {
    setEditingId(rule.id);
    setForm({
      cat: rule.cat || "general",
      title: rule.title || "",
      desc: rule.desc || "",
      tag: rule.tag || "NỘI QUY",
      color: rule.color || "green",
      body: rule.body || "",
      important: Boolean(rule.important),
      active: rule.active !== false,
    });
    setFormOpen(true);
  }

  async function saveRule() {
    if (!form.title.trim()) {
      messageApi.warning("Vui lòng nhập tiêu đề nội quy");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        cat: form.cat,
        title: form.title,
        desc: form.desc,
        tag: form.tag,
        color: form.color,
        body: form.body,
        important: form.important,
        active: form.active,
        createdBy: userKey,
      };
      if (editingId == null) {
        const res = await axios.post("/api/rulesCompany", payload);
        setRules((prev) => [res.data.data, ...prev]);
        messageApi.success("Đã thêm nội quy mới");
      } else {
        const res = await axios.put(
          `/api/rulesCompany/item/${editingId}`,
          payload
        );
        setRules((prev) =>
          prev.map((r) => (r.id === editingId ? res.data.data : r))
        );
        messageApi.success("Đã cập nhật nội quy");
      }
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      messageApi.error(
        err.response?.data?.error || "Không thể lưu nội quy"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(rule, hard = false) {
    try {
      await axios.delete(`/api/rulesCompany/item/${rule.id}`, {
        params: hard ? { hard: 1 } : {},
      });
      if (hard) {
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
        messageApi.success("Đã xóa vĩnh viễn nội quy");
      } else {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, active: false } : r))
        );
        messageApi.success("Đã ẩn nội quy");
      }
    } catch (err) {
      console.error(err);
      messageApi.error(
        err.response?.data?.error || "Không thể xóa nội quy"
      );
    }
  }

  async function toggleActive(rule) {
    try {
      const res = await axios.put(`/api/rulesCompany/item/${rule.id}`, {
        active: !(rule.active !== false),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? res.data.data : r))
      );
    } catch (err) {
      console.error(err);
      messageApi.error("Không thể cập nhật trạng thái");
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="rules-page">
      {contextHolder}

      {/* ====== HEADER ====== */}
      <div className="rules-hero">
        <div>
          <h1>Nội quy & Quy định công ty</h1>
          <p>
            Vui lòng đọc kỹ các quy định và xác nhận đã nắm rõ trước khi thực
            hiện công việc.
          </p>
        </div>
        <div className="rules-hero-date">
          Cập nhật lần cuối
          <strong>
            {new Date().toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </strong>
        </div>
      </div>

      {/* ====== THỐNG KÊ ====== */}
      <div className="rules-stats">
        <div className="rules-stat">
          <div className="rules-stat-label">Tổng số nội quy</div>
          <div className="rules-stat-value">{totalRules}</div>
          <div className="rules-stat-note">Đang áp dụng</div>
        </div>
        <div className="rules-stat">
          <div className="rules-stat-label">Đã đọc</div>
          <div className="rules-stat-value">{readCount}</div>
          <div className="rules-stat-note">Nội quy cá nhân</div>
        </div>
        <div className="rules-stat">
          <div className="rules-stat-label">Chưa đọc</div>
          <div className="rules-stat-value">{unreadCount}</div>
          <div className="rules-stat-note">Cần xem</div>
        </div>
        <div className="rules-stat">
          <div className="rules-stat-label">Nội quy quan trọng</div>
          <div className="rules-stat-value">{importantCount}</div>
          <div className="rules-stat-note">Bắt buộc tuân thủ</div>
        </div>
      </div>

      {/* ====== TOOLBAR ====== */}
      <div className="rules-toolbar">
        <div className="rules-search">
          <span>⌕</span>
          <input
            placeholder="Tìm nội quy, từ khóa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rules-select"
        >
          <option value="all">Tất cả danh mục</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rules-select"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
        <button className="rules-btn rules-btn-light" onClick={markAllRead}>
          ✓ Đánh dấu đã đọc tất cả
        </button>
        {canManage && (
          <button
            className="rules-btn rules-btn-primary"
            onClick={openCreate}
          >
            ➕ Thêm nội quy
          </button>
        )}
      </div>

      {/* ====== NAV NHANH + MAIN ====== */}
      <div className="rules-layout">
        <div>
          <div className="rules-nav">
            <button
              className={activeNav === "all" ? "active" : ""}
              onClick={() => {
                setActiveNav("all");
                setCategory("all");
              }}
            >
              📋 Tất cả nội quy
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={activeNav === c.value ? "active" : ""}
                onClick={() => {
                  setActiveNav(c.value);
                  setCategory(c.value);
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <div className="rules-list">
            {loading ? (
              <div className="rules-empty">Đang tải...</div>
            ) : filteredRules.length === 0 ? (
              <div className="rules-empty">
                Không tìm thấy nội quy phù hợp.
              </div>
            ) : (
              filteredRules.map((r, idx) => {
                const isRead = Boolean(readMap[r.id]);
                return (
                  <article className="rules-card" key={r.id}>
                    <div className="rules-card-head">
                      <div className="rules-num">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3>{r.title}</h3>
                        <p>{r.desc}</p>
                        <div style={{ marginTop: 8 }}>
                          <span className={`rules-tag rules-tag-${r.color}`}>
                            {r.tag}
                          </span>
                          <span
                            className="rules-tag"
                            style={{ marginLeft: 6 }}
                          >
                            {CAT_ICON(r.cat)} {CAT_LABEL(r.cat)}
                          </span>
                          {isRead && (
                            <span
                              className="rules-tag rules-tag-green"
                              style={{ marginLeft: 6 }}
                            >
                              ✓ ĐÃ ĐỌC
                            </span>
                          )}
                          {r.important && (
                            <span
                              className="rules-tag rules-tag-red"
                              style={{ marginLeft: 6 }}
                            >
                              ★ QUAN TRỌNG
                            </span>
                          )}
                          {r.active === false && (
                            <span
                              className="rules-tag"
                              style={{
                                marginLeft: 6,
                                background: "#fee2e2",
                                color: "#b91c1c",
                              }}
                            >
                              ĐÃ ẨN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rules-card-actions">
                      <button
                        className="rules-btn rules-btn-light rules-btn-sm"
                        onClick={() => setViewRule(r)}
                      >
                        Xem chi tiết →
                      </button>
                      {canManage && (
                        <>
                          <button
                            className="rules-btn rules-btn-light rules-btn-sm"
                            onClick={() => openEdit(r)}
                          >
                            ✏️ Sửa
                          </button>
                          <Popconfirm
                            title={
                              r.active === false
                                ? "Kích hoạt lại nội quy này?"
                                : "Ẩn nội quy này?"
                            }
                            onConfirm={() => toggleActive(r)}
                            okText="Có"
                            cancelText="Không"
                          >
                            <button className="rules-btn rules-btn-light rules-btn-sm">
                              {r.active === false ? "👁️ Hiện" : "🚫 Ẩn"}
                            </button>
                          </Popconfirm>
                          <Popconfirm
                            title="Xóa vĩnh viễn nội quy này?"
                            description="Hành động này không thể hoàn tác."
                            okText="Xóa"
                            okButtonProps={{ danger: true }}
                            cancelText="Hủy"
                            onConfirm={() => deleteRule(r, true)}
                          >
                            <button
                              className="rules-btn rules-btn-sm"
                              style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </Popconfirm>
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* ====== SIDEBAR PHẢI ====== */}
        <aside className="rules-side">
          <div className="rules-side-card">
            <h3>Tiến độ đọc nội quy</h3>
            <div className="rules-progress">
              <div
                style={{ width: `${percent}%` }}
                className="rules-progress-bar"
              />
            </div>
            <div className="rules-progress-text">
              <span>
                {readCount}/{totalRules} nội quy
              </span>
              <b>{percent}%</b>
            </div>
          </div>

          <div className="rules-side-card">
            <h3>📌 Nội quy cần chú ý</h3>
            {importantList.length === 0 ? (
              <p style={{ fontSize: 12, color: "#667085" }}>
                Chưa có nội quy quan trọng.
              </p>
            ) : (
              importantList.map((r) => (
                <div className="rules-important" key={r.id}>
                  <strong>{r.title}</strong>
                  <p>{r.desc}</p>
                </div>
              ))
            )}
          </div>

          {/* <div className="rules-side-card">
            <h3>📞 Liên hệ</h3>
            <div className="rules-contact">
              Nếu có thắc mắc về nội quy:
              <br />
              <b>Phòng Hành chính / Nhân sự</b>
              <br />
              Email: hr@lmcgroups.com
            </div>
          </div> */}
        </aside>
      </div>

      <div className="rules-footer">
        © 2026 LMC GROUPS · Hệ thống quản lý nội quy nội bộ
      </div>

      {/* ====== MODAL XEM CHI TIẾT ====== */}
      <Modal
        open={!!viewRule}
        onCancel={() => setViewRule(null)}
        footer={null}
        title={viewRule?.title}
        width={760}
      >
        {viewRule && (
          <>
            <div className="rules-modal-meta">
              <span className={`rules-tag rules-tag-${viewRule.color}`}>
                {viewRule.tag}
              </span>
              <span className="rules-tag" style={{ marginLeft: 6 }}>
                {CAT_ICON(viewRule.cat)} {CAT_LABEL(viewRule.cat)}
              </span>
              {viewRule.important && (
                <span
                  className="rules-tag rules-tag-red"
                  style={{ marginLeft: 6 }}
                >
                  ★ QUAN TRỌNG
                </span>
              )}
            </div>
            <div
              className="rules-modal-content"
              dangerouslySetInnerHTML={{
                __html:
                  viewRule.body ||
                  `<p>${viewRule.desc || "Không có nội dung chi tiết."}</p>`,
              }}
            />
            <div className="rules-check-row">
              <Checkbox
                checked={Boolean(readMap[viewRule.id])}
                onChange={(e) => {
                  if (e.target.checked) ackRule(viewRule.id);
                }}
              >
                Tôi đã đọc, hiểu và cam kết tuân thủ nội quy này.
              </Checkbox>
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                className="rules-btn rules-btn-primary"
                onClick={() => ackRule(viewRule.id)}
                disabled={Boolean(readMap[viewRule.id])}
              >
                {readMap[viewRule.id] ? "✓ Đã xác nhận" : "Xác nhận đã đọc"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ====== MODAL THÊM / SỬA (CHỈ ADMIN) ====== */}
      <Modal
        open={formOpen}
        title={editingId == null ? "➕ Thêm nội quy mới" : "✏️ Cập nhật nội quy"}
        onCancel={() => setFormOpen(false)}
        onOk={saveRule}
        okText={editingId == null ? "Thêm" : "Lưu"}
        cancelText="Hủy"
        confirmLoading={saving}
        width={760}
        destroyOnClose
      >
        <div className="rules-form">
          <div className="rules-form-row">
            <label>Danh mục *</label>
            <Select
              value={form.cat}
              onChange={(v) => setForm({ ...form, cat: v })}
              style={{ width: "100%" }}
            >
              {CATEGORIES.map((c) => (
                <Option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </Option>
              ))}
            </Select>
          </div>

          <div className="rules-form-row">
            <label>Tiêu đề *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Quy định về tác phong và văn hóa công ty"
            />
          </div>

          <div className="rules-form-row">
            <label>Mô tả ngắn</label>
            <Input
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Tóm tắt 1 dòng để hiển thị ngoài danh sách"
            />
          </div>

          <div className="rules-form-grid">
            <div className="rules-form-row">
              <label>Nhãn (tag)</label>
              <Input
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                placeholder="VD: QUAN TRỌNG / BẢO MẬT..."
              />
            </div>
            <div className="rules-form-row">
              <label>Màu nhãn</label>
              <Select
                value={form.color}
                onChange={(v) => setForm({ ...form, color: v })}
                style={{ width: "100%" }}
              >
                {COLORS.map((c) => (
                  <Option key={c.value} value={c.value}>
                    {c.label}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="rules-form-row">
            <label>Nội dung chi tiết</label>
            <RichTextEditor
              value={form.body}
              onChange={(html) => setForm({ ...form, body: html })}
              placeholder="Nhập nội dung chi tiết... Bôi đen chữ rồi bấm B / I / U để định dạng."
            />
          </div>

          <div className="rules-form-row rules-form-checks">
            <Switch
              checked={form.important}
              onChange={(v) => setForm({ ...form, important: v })}
            />
            <span style={{ marginLeft: 8 }}>Đánh dấu là nội quy quan trọng</span>

            <Switch
              checked={form.active}
              onChange={(v) => setForm({ ...form, active: v })}
              style={{ marginLeft: 24 }}
            />
            <span style={{ marginLeft: 8 }}>Đang áp dụng</span>
          </div>

          {editingId != null && (
            <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 12 }}>
              ID: {editingId}
            </div>
          )}
        </div>
      </Modal>

      {/* ====== STYLE ====== */}
      <style jsx global>{`
        .rules-page {
          padding: 24px 32px;
          max-width: 1450px;
          margin: 0 auto;
          font-family: Inter, Arial, sans-serif;
          color: #172033;
          background: #f5f7fb;
          min-height: 100vh;
        }
        .rules-hero {
          background: linear-gradient(135deg, #0f172a, #1d4ed8);
          color: #fff;
          border-radius: 16px;
          padding: 28px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
        }
        .rules-hero h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }
        .rules-hero p {
          margin: 0;
          color: #dbeafe;
          line-height: 1.6;
        }
        .rules-hero-date {
          text-align: right;
          font-size: 13px;
          color: #dbeafe;
        }
        .rules-hero-date strong {
          display: block;
          color: #fff;
          font-size: 20px;
          margin-top: 5px;
        }

        .rules-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .rules-stat {
          background: #fff;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
        }
        .rules-stat-label {
          font-size: 13px;
          color: #667085;
        }
        .rules-stat-value {
          font-size: 25px;
          font-weight: 750;
          margin-top: 7px;
        }
        .rules-stat-note {
          font-size: 12px;
          color: #16a34a;
          margin-top: 5px;
        }

        .rules-toolbar {
          background: #fff;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .rules-search {
          flex: 1;
          min-width: 240px;
          position: relative;
        }
        .rules-search input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          border: 1px solid #d9dee8;
          border-radius: 8px;
          outline: none;
          background: #fff;
        }
        .rules-search input:focus {
          border-color: #1677ff;
          box-shadow: 0 0 0 3px #eaf2ff;
        }
        .rules-search span {
          position: absolute;
          left: 14px;
          top: 10px;
          color: #98a2b3;
        }
        .rules-select {
          padding: 10px 34px 10px 12px;
          border: 1px solid #d9dee8;
          border-radius: 8px;
          background: #fff;
          color: #344054;
          min-width: 160px;
        }

        .rules-btn {
          border: 0;
          border-radius: 8px;
          padding: 10px 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .rules-btn-primary {
          background: #1677ff;
          color: #fff;
        }
        .rules-btn-primary:hover:not(:disabled) {
          background: #0958d9;
        }
        .rules-btn-light {
          background: #f2f4f7;
          color: #344054;
        }
        .rules-btn-light:hover {
          background: #e5e7eb;
        }
        .rules-btn-sm {
          font-size: 12px;
          padding: 7px 10px;
        }
        .rules-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rules-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 20px;
        }

        .rules-nav {
          background: #fff;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
          box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
        }
        .rules-nav button {
          border: 0;
          background: transparent;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          color: #475467;
          font-family: inherit;
          font-size: 13px;
        }
        .rules-nav button:hover {
          background: #f2f4f7;
        }
        .rules-nav button.active {
          background: #1d4ed8;
          color: #fff;
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rules-card {
          background: #fff;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
          transition: 0.15s;
        }
        .rules-card:hover {
          border-color: #c7d7f8;
          transform: translateY(-1px);
        }
        .rules-card-head {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .rules-num {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #eff6ff;
          color: #1d4ed8;
          display: grid;
          place-items: center;
          font-weight: 750;
          flex: none;
        }
        .rules-card h3 {
          margin: 1px 0 6px;
          font-size: 16px;
        }
        .rules-card p {
          margin: 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.6;
        }

        .rules-tag {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 650;
          background: #f2f4f7;
          color: #475467;
        }
        .rules-tag-red {
          background: #fef3f2;
          color: #b42318;
        }
        .rules-tag-yellow {
          background: #fffaeb;
          color: #b54708;
        }
        .rules-tag-green {
          background: #ecfdf3;
          color: #027a48;
        }

        .rules-card-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rules-side-card {
          background: #fff;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 15px;
          box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
        }
        .rules-side-card h3 {
          font-size: 15px;
          margin: 0 0 15px;
        }
        .rules-progress {
          height: 8px;
          background: #eaecf0;
          border-radius: 10px;
          overflow: hidden;
        }
        .rules-progress-bar {
          height: 100%;
          background: #1677ff;
          transition: width 0.4s;
        }
        .rules-progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #667085;
          margin-top: 8px;
        }

        .rules-important {
          border-left: 4px solid #ef4444;
          background: #fff7f6;
          padding: 12px;
          border-radius: 7px;
          margin-bottom: 9px;
        }
        .rules-important strong {
          font-size: 13px;
        }
        .rules-important p {
          font-size: 12px;
          color: #667085;
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .rules-contact {
          font-size: 13px;
          color: #667085;
          line-height: 1.7;
        }

        .rules-empty {
          padding: 45px;
          text-align: center;
          color: #667085;
          background: #fff;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
        }

        .rules-footer {
          color: #98a2b3;
          font-size: 12px;
          text-align: center;
          padding: 30px;
        }

        .rules-modal-meta {
          margin-bottom: 16px;
        }
        .rules-modal-content {
          line-height: 1.75;
          color: #475467;
          font-size: 14px;
        }
        .rules-modal-content h4 {
          color: #172033;
          margin-bottom: 4px;
        }
        .rules-check-row {
          background: #f8fafc;
          border: 1px solid #e8ebf0;
          padding: 12px;
          border-radius: 8px;
          margin: 15px 0;
          font-size: 13px;
        }

        .rules-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 8px;
        }
        .rules-form-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rules-form-row label {
          font-size: 13px;
          font-weight: 600;
          color: #344054;
        }
        .rules-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .rules-form-checks {
          flex-direction: row;
          align-items: center;
          background: #f8fafc;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #e8ebf0;
        }

        @media (max-width: 1100px) {
          .rules-layout {
            grid-template-columns: 1fr;
          }
          .rules-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .rules-hero {
            flex-direction: column;
            align-items: flex-start;
          }
          .rules-hero-date {
            text-align: left;
          }
          .rules-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}