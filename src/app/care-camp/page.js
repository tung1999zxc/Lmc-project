"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Button,
  Input,
  InputNumber,
  Switch,
  Checkbox,
  Tag,
  Space,
  Tooltip,
  message,
  Alert,
  Segmented,
  Popconfirm,
} from "antd";
import {
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  DeleteOutlined,
  WarningOutlined,
  FacebookOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

const money = (n) => Number(n || 0).toLocaleString("vi-VN");

const API_SETTINGS = "/api/care-camp/my-settings";
const API_ADSETS = "/api/care-camp/adsets";
const API_CHECK = "/api/care-camp/check";
const API_LOGS = "/api/care-camp/logs";
const API_FB_STATUS = "/api/care-camp/facebook/status";

/* --------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */
function extractTag(name) {
  const m = String(name || "").match(/\[([A-Za-z0-9_\-]+)\]/i);
  return m ? m[1].toUpperCase() : "";
}

/** Chọn chỉ số kết quả: CPC > CPL > CPR (giống logic extension) */
function pickResult(metrics, useCpl, useCpc, optimizationGoal) {
  if (useCpc && metrics.inlineLinkClicks > 0)
    return { count: metrics.inlineLinkClicks, label: "CPC" };
  if (useCpl && metrics.conversations > 0)
    return { count: metrics.conversations, label: "CPL" };
  if (metrics.conversations > 0)
    return { count: metrics.conversations, label: "CPR" };
  if (optimizationGoal === "LINK_CLICKS" && metrics.inlineLinkClicks > 0)
    return { count: metrics.inlineLinkClicks, label: "CPC" };
  return { count: 0, label: "CPR" };
}

function calcPrice(metrics, result) {
  return result.count > 0 ? Math.round(metrics.spend / result.count) : 0;
}

/* --------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */
export default function CareCampPage() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.user.currentUser || {});

  // tab hiển thị: "metrics" | "autopause"
  const [tab, setTab] = useState("metrics");

  // cấu hình chung
  const [token, setToken] = useState("");
  const [accountsText, setAccountsText] = useState("");
  const [maxSpend, setMaxSpend] = useState(10000);
  const [maxPrice, setMaxPrice] = useState(12000);
  const [maxCpm, setMaxCpm] = useState(50000);
  const [useCpl, setUseCpl] = useState(false);
  const [useCpc, setUseCpc] = useState(false);
  const [pauseCampaignToo, setPauseCampaignToo] = useState(false);
  const [running, setRunning] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [monitored, setMonitored] = useState([]);
  const [prevResults, setPrevResults] = useState({});

  // dữ liệu bảng
  const [rows, setRows] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ---- Facebook OAuth: lấy token tự động ----
  const [fbAppConfigured, setFbAppConfigured] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [accLoading, setAccLoading] = useState(false);
  const [fbAccounts, setFbAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [accSearch, setAccSearch] = useState("");

  // Ref theo dõi ô nhập ID tài khoản (tránh stale closure khi đồng bộ chip)
  const accountsTextRef = useRef("");
  useEffect(() => {
    accountsTextRef.current = accountsText;
  }, [accountsText]);

  useEffect(() => {
    if (!currentUser?.name) router.push("/login");
  }, [currentUser?.name, router]);

  // Header gửi tên nhân viên đang đăng nhập -> server biết lưu báo cáo của ai
  const empHeaders = useMemo(
    () => ({ headers: { "x-employee-name": currentUser?.name || "" } }),
    [currentUser?.name],
  );

  /* ---------------- Load cấu hình ---------------- */
  const loadSettings = useCallback(async () => {
    try {
      const res = await axios.get(API_SETTINGS, empHeaders);
      const d = res.data?.data || {};
      setMaxSpend(d.maxSpend ?? 10000);
      setMaxPrice(d.maxPrice ?? 12000);
      setMaxCpm(d.maxCpm ?? 50000);
      setUseCpl(!!d.useCpl);
      setUseCpc(!!d.useCpc);
      setPauseCampaignToo(!!d.pauseCampaignToo);
      setRunning(!!d.running);
      setHasToken(!!d.hasToken);
      setMonitored(Array.isArray(d.monitored) ? d.monitored : []);
      setPrevResults(d.prevResults || {});
      if (Array.isArray(d.accounts) && d.accounts.length) {
        setAccountsText(d.accounts.map((a) => a.id).join(", "));
      }
    } catch (e) {
      console.error(e);
    }
  }, [empHeaders]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* ---------------- Facebook: kiểm tra cấu hình App ---------------- */
  const loadFbStatus = useCallback(async () => {
    try {
      const res = await axios.get(API_FB_STATUS, empHeaders);
      setFbAppConfigured(!!res.data?.data?.fbAppConfigured);
    } catch (e) {
      console.error(e);
    }
  }, [empHeaders]);

  useEffect(() => {
    loadFbStatus();
  }, [loadFbStatus]);

  /* ---------------- Facebook: lấy token tự động ---------------- */
  // Mở popup Facebook Login -> Facebook tự nhận diện nick đang đăng nhập.
  const autoGetToken = async () => {
    if (!currentUser?.name) {
      message.warning("Bạn chưa đăng nhập hệ thống.");
      return;
    }
    if (!fbAppConfigured) {
      message.error(
        "Server chưa cấu hình Facebook App (FB_APP_ID / FB_APP_SECRET). Hãy dán token thủ công hoặc liên hệ admin cấu hình.",
      );
      return;
    }

    setFbLoading(true);
    const popupWidth = 620;
    const popupHeight = 720;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    const url = `/api/care-camp/facebook/login?employee=${encodeURIComponent(
      currentUser.name,
    )}`;
    const popup = window.open(
      url,
      "fb_oauth",
      `width=${popupWidth},height=${popupHeight},left=${Math.round(left)},top=${Math.round(top)}`,
    );

    if (!popup) {
      setFbLoading(false);
      message.error("Trình duyệt chặn popup. Hãy cho phép popup cho trang này.");
      return;
    }

    // Lắng nghe kết quả từ popup (postMessage) hoặc localStorage
    let done = false;
    const finish = async (payload) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
      setFbLoading(false);
      try {
        popup.close();
      } catch {
        // ignore
      }

      if (payload?.ok) {
        message.success(
          `Đã lấy token tự động${
            payload.employeeName ? ` cho ${payload.employeeName}` : ""
          }.`,
        );
        await loadSettings();
        await loadFbAccounts();
      } else {
        message.error(payload?.message || "Không lấy được token từ Facebook.");
      }
    };

    const onMessage = (e) => {
      if (e.data?.type === "FB_TOKEN_RESULT") finish(e.data.payload);
    };
    window.addEventListener("message", onMessage);

    // Dự phòng: popup đóng mà chưa có postMessage
    const timer = setInterval(() => {
      if (popup.closed) {
        try {
          const raw = localStorage.getItem("fbTokenResult");
          if (raw) {
            const parsed = JSON.parse(raw);
            localStorage.removeItem("fbTokenResult");
            finish(parsed);
          } else {
            finish({ ok: false, message: "Đã đóng cửa sổ Facebook." });
          }
        } catch {
          finish({ ok: false, message: "Đã đóng cửa sổ Facebook." });
        }
      }
    }, 800);
  };

  /* ---------------- Facebook: lấy danh sách tài khoản QC ---------------- */
  // Chỉ HIỂN THỊ danh sách, KHÔNG tự chọn sẵn.
  // Nhân viên tự bấm vào tài khoản nào cần dùng.
  const loadFbAccounts = useCallback(async () => {
    setAccLoading(true);
    try {
      const res = await axios.get(`${API_FB_STATUS}?mode=accounts`, empHeaders);
      const list = res.data?.data || [];
      setFbAccounts(list);
      // Đồng bộ trạng thái chọn theo những gì đang có trong ô nhập
      const current = accountsTextRef.current
        .split(/[\s,;]+/)
        .map((s) => s.replace(/^act_/i, "").trim())
        .filter(Boolean);
      setSelectedAccountIds(current);
      if (!list.length) {
        message.info("Không tìm thấy tài khoản quảng cáo nào với token này.");
      } else {
        message.success(
          `Đã hiện ${list.length} tài khoản quảng cáo. Bấm vào tài khoản nào bạn cần dùng.`,
        );
      }
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.error || "Không lấy được danh sách tài khoản QC.",
      );
    } finally {
      setAccLoading(false);
    }
  }, [empHeaders]);

  /* ---------------- Chọn / bỏ chọn tài khoản QC ---------------- */
  const toggleAccount = (id) => {
    setSelectedAccountIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setAccountsText(next.join(", "));
      return next;
    });
  };

  /* ---------------- Bỏ chọn tất cả ---------------- */
  const clearAccounts = () => {
    setSelectedAccountIds([]);
    setAccountsText("");
  };

  /* ---------------- Tự động lưu báo cáo khi mở trang ---------------- */
  // Nhân viên chỉ cần MỞ trang Care Camp là báo cáo được ghi tự động.
  const [autoSnapDone, setAutoSnapDone] = useState(false);

  useEffect(() => {
    if (autoSnapDone) return;
    const ids = accountsText
      .split(/[\s,;]+/)
      .map((s) => s.replace(/^act_/i, "").trim())
      .filter(Boolean);
    if (!ids.length) return;

    setAutoSnapDone(true);
    // Chạy nền, không hiện thông báo để không làm phiền người dùng
    axios
      .get(API_ADSETS, {
        ...empHeaders,
        params: { ids: ids.join(","), type: "adsets" },
      })
      .then((res) => {
        const flat = [];
        (res.data?.data || []).forEach((acc) => {
          (acc.items || []).forEach((it) => {
            flat.push({
              key: it.id,
              adsetId: it.id,
              accountId: acc.accountId,
              accountName: acc.accountName,
              name: it.name,
              campaignName: it.campaignName,
              campaignId: it.campaignId,
              optimizationGoal: it.optimizationGoal,
              dailyBudget: it.dailyBudget,
              lifetimeBudget: it.lifetimeBudget,
              metrics: it.metrics,
            });
          });
        });
        if (flat.length) setRows(flat);
      })
      .catch(() => {});
  }, [accountsText, empHeaders, autoSnapDone]);

  /* ---------------- Load nhóm quảng cáo ---------------- */
  const loadAdsets = useCallback(async () => {
    const ids = accountsText
      .split(/[\s,;]+/)
      .map((s) => s.replace(/^act_/i, "").trim())
      .filter(Boolean);
    if (!ids.length) {
      message.warning("Vui lòng nhập ít nhất 1 ID tài khoản quảng cáo.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(API_ADSETS, {
        ...empHeaders,
        params: { ids: ids.join(","), type: "adsets" },
      });
      const flat = [];
      (res.data?.data || []).forEach((acc) => {
        (acc.items || []).forEach((it) => {
          flat.push({
            key: it.id,
            adsetId: it.id,
            accountId: acc.accountId,
            accountName: acc.accountName,
            name: it.name,
            campaignName: it.campaignName,
            campaignId: it.campaignId,
            optimizationGoal: it.optimizationGoal,
            dailyBudget: it.dailyBudget,
            lifetimeBudget: it.lifetimeBudget,
            metrics: it.metrics,
          });
        });
      });
      setRows(flat);
      message.success(
        `Đã tải ${flat.length} nhóm đang phân phối. Báo cáo hôm nay đã được lưu tự động.`,
      );
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.error || "Lỗi tải danh sách nhóm.");
    } finally {
      setLoading(false);
    }
  }, [accountsText, empHeaders]);

  /* ---------------- Load log ---------------- */
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get(API_LOGS, {
        params: { limit: 100, name: currentUser?.name || "" },
      });
      setLogs(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  }, [currentUser?.name]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /* ---------------- Lưu cấu hình ---------------- */
  const saveSettings = useCallback(
    async (extra = {}) => {
      setSaving(true);
      try {
        const accounts = accountsText
          .split(/[\s,;]+/)
          .map((s) => s.replace(/^act_/i, "").trim())
          .filter(Boolean)
          .map((id) => ({ id, name: id }));

        const payload = {
          accounts,
          maxSpend,
          maxPrice,
          maxCpm,
          useCpl,
          useCpc,
          pauseCampaignToo,
          ...extra,
        };
        if (token && token.trim()) payload.token = token.trim();

        const res = await axios.put(API_SETTINGS, payload, empHeaders);
        const d = res.data?.data || {};
        setHasToken(!!d.hasToken);
        setRunning(!!d.running);
        setMonitored(Array.isArray(d.monitored) ? d.monitored : []);
        setPrevResults(d.prevResults || {});
        setToken("");
        message.success(res.data?.message || "Đã lưu cấu hình.");
        return true;
      } catch (e) {
        console.error(e);
        message.error(e?.response?.data?.error || "Lỗi lưu cấu hình.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      accountsText,
      maxSpend,
      maxPrice,
      maxCpm,
      useCpl,
      useCpc,
      pauseCampaignToo,
      token,
      empHeaders,
    ],
  );

  /* ---------------- Bắt đầu / dừng giám sát ---------------- */
  const startMonitoring = async () => {
    const ids = selectedKeys.map(String);
    if (!ids.length) {
      message.warning("Vui lòng chọn ít nhất 1 nhóm quảng cáo để giám sát.");
      return;
    }
    const list = rows
      .filter((r) => ids.includes(String(r.adsetId)))
      .map((r) => {
        const conf = monitored.find((m) => String(m.adsetId) === String(r.adsetId));
        return {
          adsetId: r.adsetId,
          accountId: r.accountId,
          accountName: r.accountName,
          name: r.name,
          campaignName: r.campaignName,
          maxSpend: conf?.maxSpend || maxSpend,
          maxPrice: conf?.maxPrice || maxPrice,
          maxCpm: conf?.maxCpm || maxCpm,
        };
      });
    const ok = await saveSettings({ running: true, monitored: list });
    if (ok) {
      setSelectedKeys([]);
      message.success(`Đang giám sát ${list.length} nhóm.`);
    }
  };

  const stopMonitoring = async () => {
    await saveSettings({ running: false });
  };

  /* ---------------- Quét ngay ---------------- */
  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await axios.get(API_CHECK);
      const data = res.data || {};
      if ((data.actions || []).length) {
        const paused = data.actions.filter((a) => a.type === "pause").length;
        message.success(
          `Đã quét. Tắt ${paused} nhóm, ${data.actions.length} hành động.`,
        );
      } else {
        message.success("Đã quét — không có nhóm nào vượt ngưỡng.");
      }
      await loadSettings();
      await loadLogs();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.error || "Lỗi khi quét.");
    } finally {
      setChecking(false);
    }
  };

  /* ---------------- Bật/tắt thủ công ---------------- */
  const toggleStatus = useCallback(
    async (row, action) => {
      try {
        await axios.post(
          API_ADSETS,
          {
            adsetId: row.adsetId,
            action,
            name: row.name,
            accountId: row.accountId,
            accountName: row.accountName,
            campaignId: row.campaignId,
            campaignName: row.campaignName,
            metrics: row.metrics,
          },
          empHeaders,
        );
        message.success(
          action === "pause"
            ? `Đã tắt nhóm "${row.name}".`
            : `Đã bật lại nhóm "${row.name}".`,
        );
        loadAdsets();
      } catch (e) {
        message.error(e?.response?.data?.error || "Lỗi thao tác.");
      }
    },
    [empHeaders, loadAdsets],
  );

  const pauseCampaign = useCallback(
    async (row) => {
      try {
        await axios.post(
          API_ADSETS,
          {
            type: "campaign",
            campaignId: row.campaignId,
            action: "pause",
          },
          empHeaders,
        );
        message.success(`Đã tắt chiến dịch "${row.campaignName}".`);
      } catch (e) {
        message.error(e?.response?.data?.error || "Lỗi tắt chiến dịch.");
      }
    },
    [empHeaders],
  );

  /* ---------------- Cập nhật cấu hình riêng của nhóm ---------------- */
  const updateRowConfig = useCallback((adsetId, patch) => {
    setMonitored((prev) => {
      const exists = prev.some((m) => String(m.adsetId) === String(adsetId));
      const base = prev.find((m) => String(m.adsetId) === String(adsetId)) || {
        adsetId,
        accountId: "",
        accountName: "",
        name: "",
        campaignName: "",
        maxSpend,
        maxPrice,
        maxCpm,
      };
      const updated = { ...base, ...patch, adsetId };
      if (exists)
        return prev.map((m) =>
          String(m.adsetId) === String(adsetId) ? updated : m,
        );
      return [...prev, updated];
    });
  }, [maxSpend, maxPrice, maxCpm]);

  /* ---------------- Dữ liệu bảng đã enrich ---------------- */
  const enriched = useMemo(() => {
    return rows.map((r) => {
      const result = pickResult(
        r.metrics,
        useCpl,
        useCpc,
        r.optimizationGoal,
      );
      const price = calcPrice(r.metrics, result);
      const cpc =
        r.metrics.inlineLinkClicks > 0
          ? Math.round(r.metrics.spend / r.metrics.inlineLinkClicks)
          : 0;
      const conf = monitored.find(
        (m) => String(m.adsetId) === String(r.adsetId),
      );
      const limitSpend = conf?.maxSpend || maxSpend;
      const limitPrice = conf?.maxPrice || maxPrice;
      const limitCpm = conf?.maxCpm || maxCpm;

      const priceBreached = result.count === 0 || price > limitPrice;
      const cpcBreached = useCpc
        ? r.metrics.inlineLinkClicks === 0 || cpc > limitPrice
        : priceBreached;
      const breached =
        r.metrics.spend > limitSpend &&
        (useCpc ? cpcBreached : priceBreached) &&
        r.metrics.cpm > limitCpm;

      // So sánh với lần quét trước (để hiển thị mức tăng KQ)
      const prev = prevResults[String(r.adsetId)];
      const delta =
        prev !== undefined && prev !== null ? result.count - Number(prev) : null;

      return {
        ...r,
        resultCount: result.count,
        resultLabel: result.label,
        price,
        cpc,
        limitSpend,
        limitPrice,
        limitCpm,
        breached,
        delta,
        tag: extractTag(r.name),
      };
    });
  }, [rows, useCpl, useCpc, monitored, maxSpend, maxPrice, maxCpm, prevResults]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter((r) =>
      [r.name, r.accountName, r.campaignName, r.tag]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [enriched, search]);

  /* ---------------- Danh sách tài khoản QC đã lọc ---------------- */
  const filteredFbAccounts = useMemo(() => {
    const q = accSearch.trim().toLowerCase();
    if (!q) return fbAccounts;
    return fbAccounts.filter((a) =>
      [a.name, a.id, a.currency]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [fbAccounts, accSearch]);

  /* ---------------- Cột bảng ---------------- */
  const columns = useMemo(
    () => [
      {
        title: (
          <Checkbox
            onChange={(e) =>
              setSelectedKeys(e.target.checked ? filtered.map((r) => r.key) : [])
            }
            checked={
              filtered.length > 0 &&
              selectedKeys.length === filtered.length
            }
            indeterminate={
              selectedKeys.length > 0 && selectedKeys.length < filtered.length
            }
          />
        ),
        key: "sel",
        width: 40,
        render: (_, r) => (
          <Checkbox
            checked={selectedKeys.includes(r.key)}
            onChange={(e) =>
              setSelectedKeys((prev) =>
                e.target.checked
                  ? [...prev, r.key]
                  : prev.filter((k) => k !== r.key),
              )
            }
          />
        ),
      },
      {
        title: "Tài khoản",
        dataIndex: "accountName",
        key: "accountName",
        width: 150,
        render: (v) => (
          <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>
        ),
      },
      {
        title: "Chiến dịch",
        dataIndex: "campaignName",
        key: "campaignName",
        width: 180,
        render: (v) => (
          <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
            {v || "-"}
          </span>
        ),
      },
      {
        title: "Nhóm quảng cáo",
        dataIndex: "name",
        key: "name",
        render: (v, r) => (
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {v}{" "}
              {r.tag && (
                <Tag color="purple" style={{ marginLeft: 4 }}>
                  {r.tag}
                </Tag>
              )}
            </div>
            {r.adsetId && (
              <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                {r.adsetId}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Tiêu hôm nay",
        key: "spend",
        width: 130,
        align: "right",
        render: (_, r) => (
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: r.metrics.spend > r.limitSpend ? "#dc2626" : "#b45309",
            }}
          >
            {money(r.metrics.spend)} đ
          </span>
        ),
      },
      {
        title: "Kết quả",
        key: "result",
        width: 110,
        align: "right",
        render: (_, r) => (
          <div>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#16a34a" }}>
              {money(r.resultCount)}
            </span>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>
              {r.resultLabel}
              {r.delta !== null && r.delta !== 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    color: r.delta > 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  {r.delta > 0 ? `+${r.delta}` : r.delta}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Giá / KQ",
        key: "price",
        width: 110,
        align: "right",
        render: (_, r) => (
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: r.price > r.limitPrice ? "#dc2626" : "#dc2626",
            }}
          >
            {money(r.price)} đ
          </span>
        ),
      },
      {
        title: "CPC",
        key: "cpc",
        width: 100,
        align: "right",
        render: (_, r) => (
          <span style={{ fontFamily: "monospace", color: "#0e7490" }}>
            {money(r.cpc)} đ
          </span>
        ),
      },
      {
        title: "CPM",
        key: "cpm",
        width: 100,
        align: "right",
        render: (_, r) => (
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 600,
              color: r.metrics.cpm > r.limitCpm ? "#dc2626" : "#64748b",
            }}
          >
            {money(r.metrics.cpm)} đ
          </span>
        ),
      },
      {
        title: "Ngưỡng (tiền | giá | CPM)",
        key: "limits",
        width: 250,
        render: (_, r) => (
          <Space size={4}>
            <InputNumber
              size="small"
              style={{ width: 66 }}
              value={r.limitSpend}
              onChange={(v) =>
                updateRowConfig(r.adsetId, { maxSpend: Number(v) || 0 })
              }
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => v.replace(/\./g, "")}
            />
            <InputNumber
              size="small"
              style={{ width: 72 }}
              value={r.limitPrice}
              onChange={(v) =>
                updateRowConfig(r.adsetId, { maxPrice: Number(v) || 0 })
              }
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => v.replace(/\./g, "")}
            />
            <InputNumber
              size="small"
              style={{ width: 66 }}
              value={r.limitCpm}
              onChange={(v) =>
                updateRowConfig(r.adsetId, { maxCpm: Number(v) || 0 })
              }
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => v.replace(/\./g, "")}
            />
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 90,
        align: "center",
        render: (_, r) =>
          r.breached ? (
            <Tooltip title="Vượt ngưỡng — sẽ bị tắt tự động">
              <Tag color="red">
                <WarningOutlined /> Vượt ngưỡng
              </Tag>
            </Tooltip>
          ) : (
            <Tag color="green">An toàn</Tag>
          ),
      },
      {
        title: "Thao tác",
        key: "act",
        width: 150,
        render: (_, r) => (
          <Space size={4}>
            <Tooltip title="Tắt nhóm này">
              <Button
                size="small"
                danger
                icon={<PauseCircleOutlined />}
                onClick={() => toggleStatus(r, "pause")}
              />
            </Tooltip>
            <Tooltip title="Bật lại nhóm">
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => toggleStatus(r, "resume")}
              />
            </Tooltip>
            {r.campaignId && (
              <Tooltip title="Tắt cả chiến dịch">
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={() => pauseCampaign(r)}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ],
    [
      filtered,
      selectedKeys,
      updateRowConfig,
      toggleStatus,
      pauseCampaign,
    ],
  );

  /* ---------------- Bảng log ---------------- */
  const logColumns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (v) =>
        v ? new Date(v).toLocaleString("vi-VN") : "-",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (v) => {
        const map = {
          pause: { c: "red", t: "TẮT NHÓM" },
          raise: { c: "blue", t: "NÂNG NGƯỠNG" },
          error: { c: "orange", t: "LỖI" },
        };
        const m = map[v] || { c: "default", t: v };
        return <Tag color={m.c}>{m.t}</Tag>;
      },
    },
    {
      title: "Nhóm",
      dataIndex: "name",
      key: "name",
      render: (v, r) => (
        <div>
          <b style={{ fontSize: 12 }}>{v || "-"}</b>
          {r.campaignName && (
            <div style={{ fontSize: 11, color: "#2563eb" }}>{r.campaignName}</div>
          )}
        </div>
      ),
    },
    {
      title: "Chi tiết",
      dataIndex: "message",
      key: "message",
      render: (v) => (
        <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>
      ),
    },
  ];

  const statCards = useMemo(() => {
    const totalSpend = enriched.reduce((s, r) => s + (r.metrics.spend || 0), 0);
    const totalResult = enriched.reduce((s, r) => s + (r.resultCount || 0), 0);
    const breached = enriched.filter((r) => r.breached).length;
    const cpmAvg = totalSpend
      ? Math.round(
          enriched.reduce((s, r) => s + (r.metrics.cpm || 0), 0) /
            Math.max(1, enriched.length),
        )
      : 0;
    return [
      { label: "Số nhóm đang chạy", value: enriched.length, color: "#2563eb" },
      { label: "Tổng tiêu hôm nay", value: `${money(totalSpend)} đ`, color: "#b45309" },
      { label: "Tổng kết quả", value: money(totalResult), color: "#16a34a" },
      { label: "CPM trung bình", value: `${money(cpmAvg)} đ`, color: "#0e7490" },
      { label: "Vượt ngưỡng", value: breached, color: breached ? "#dc2626" : "#64748b" },
      { label: "Đang giám sát", value: running ? "BẬT" : "TẮT", color: running ? "#16a34a" : "#64748b" },
    ];
  }, [enriched, running]);

  /* ---------------- Render ---------------- */
  return (
    <div style={{ padding: "16px 18px", background: "#f8fafc", minHeight: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 800 }}>
            🎯 Care Camp — Chăm sóc &amp; Tự Động Tắt Chiến Dịch
          </h2>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Theo dõi chỉ số nhóm quảng cáo, tự động tắt khi vượt ngưỡng tiền / giá / CPM.
          </div>
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: "📊 Bảng Chỉ Số", value: "metrics" },
            { label: "✂️ Tự Động Tắt Nhóm", value: "autopause" },
          ]}
        />
      </div>

      {/* Thẻ tổng quan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {statCards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
              {c.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: c.color,
                fontFamily: "monospace",
                marginTop: 4,
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Thanh cấu hình token / tài khoản */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
              🔑 Access Token {hasToken && <Tag color="green">Đã có</Tag>}
            </label>
            <Space.Compact style={{ width: "100%", marginTop: 4 }}>
              <Input.Password
                style={{ flex: 1 }}
                placeholder="EAAB... (để trống = giữ token cũ)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Tooltip title="Tự động lấy token từ nick Facebook đang đăng nhập (mở popup Facebook)">
                <Button
                  icon={<FacebookOutlined />}
                  loading={fbLoading}
                  onClick={autoGetToken}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Lấy token tự động
                </Button>
              </Tooltip>
            </Space.Compact>
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
              🆔 ID Tài Khoản Quảng Cáo (phân cách dấu phẩy)
            </label>
            <Space.Compact style={{ width: "100%", marginTop: 4 }}>
              <Input
                style={{ flex: 1 }}
                placeholder="VD: 123456789, 987654321"
                value={accountsText}
                onChange={(e) => {
                  setAccountsText(e.target.value);
                  // Đồng bộ chip đã chọn theo nội dung nhập tay
                  setSelectedAccountIds(
                    e.target.value
                      .split(/[\s,;]+/)
                      .map((s) => s.replace(/^act_/i, "").trim())
                      .filter(Boolean),
                  );
                }}
              />
              <Tooltip title="Hiện danh sách tài khoản QC của bạn — không tự chọn, bạn bấm vào tài khoản nào cần dùng">
                <Button
                  icon={<SyncOutlined />}
                  loading={accLoading}
                  onClick={loadFbAccounts}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Lấy TK QC
                </Button>
              </Tooltip>
            </Space.Compact>
          </div>
          <Space>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => saveSettings()}
            >
              Lưu cấu hình
            </Button>
            <Tooltip title="Chỉ quét nhóm ĐANG PHÂN PHỐI (nhóm ACTIVE và đã có tiêu/hiển thị hôm nay) — nhóm không có chi tiêu sẽ bị bỏ qua">
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={loadAdsets}
              >
                Tải nhóm đang phân phối
              </Button>
            </Tooltip>
          </Space>
        </div>

        {!hasToken && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message={
              fbAppConfigured
                ? "Chưa có Access Token — bấm 'Lấy token tự động' để lấy token từ nick Facebook đang đăng nhập."
                : "Chưa có Access Token — hãy dán token Meta (quyền ads_read, ads_management) hoặc cấu hình FB_APP_ID / FB_APP_SECRET trên server để lấy token tự động."
            }
          />
        )}

        {fbAccounts.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                📋 Tài khoản QC của bạn — bấm để chọn
              </label>
              <Tag color="blue">
                Đã chọn: {selectedAccountIds.length}/{fbAccounts.length}
              </Tag>
              {selectedAccountIds.length > 0 && (
                <Button size="small" type="link" onClick={clearAccounts}>
                  Bỏ chọn tất cả
                </Button>
              )}
              <div style={{ flex: 1 }} />
              <Input
                allowClear
                size="small"
                placeholder="Tìm tài khoản..."
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={accSearch}
                onChange={(e) => setAccSearch(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {filteredFbAccounts.map((a) => {
                const selected = selectedAccountIds.includes(a.id);
                return (
                  <Tag
                    key={a.id}
                    color={selected ? "blue" : "default"}
                    style={{ cursor: "pointer", padding: "4px 10px", fontSize: 12 }}
                    onClick={() => toggleAccount(a.id)}
                    title={`ID: ${a.id}${a.currency ? ` · ${a.currency}` : ""}`}
                  >
                    {selected ? "✓ " : "+ "}
                    {a.name}
                    {a.currency ? ` · ${a.currency}` : ""}
                  </Tag>
                );
              })}
              {filteredFbAccounts.length === 0 && (
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Không có tài khoản nào khớp tìm kiếm.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nội dung theo tab */}
      {tab === "metrics" ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên nhóm / chiến dịch / tài khoản / tag"
              style={{ width: 320 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Đã chọn <b>{selectedKeys.length}</b> nhóm
            </span>
            <div style={{ flex: 1 }} />
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              disabled={!running}
              loading={checking}
              onClick={runCheck}
            >
              Quét &amp; tắt ngay
            </Button>
          </div>

          <Table
            size="small"
            rowKey="key"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 15, showSizeChanger: true }}
          />
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
          }}
        >
          {/* Quy tắc chung */}
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 800, color: "#0369a1", marginBottom: 10 }}>
              ⚙️ QUY TẮC TỰ ĐỘNG TẮT NHÓM (dùng chung)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>
                  1. Tổng chi tiêu &gt; (VNĐ)
                </label>
                <InputNumber
                  style={{ width: "100%", marginTop: 4 }}
                  value={maxSpend}
                  onChange={(v) => setMaxSpend(Number(v) || 0)}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                  parser={(v) => v.replace(/\./g, "")}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#0e7490" }}>
                  2. Giá / KQ (CPR·CPL·CPC) &gt; (VNĐ)
                </label>
                <InputNumber
                  style={{ width: "100%", marginTop: 4 }}
                  value={maxPrice}
                  onChange={(v) => setMaxPrice(Number(v) || 0)}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                  parser={(v) => v.replace(/\./g, "")}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>
                  3. CPM &gt; (VNĐ)
                </label>
                <InputNumber
                  style={{ width: "100%", marginTop: 4 }}
                  value={maxCpm}
                  onChange={(v) => setMaxCpm(Number(v) || 0)}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                  parser={(v) => v.replace(/\./g, "")}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                  Chế độ chỉ số
                </label>
                <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12 }}>
                    <Switch
                      size="small"
                      checked={useCpl}
                      onChange={setUseCpl}
                    />{" "}
                    <span style={{ color: "#0e7490" }}>Dùng CPL (hội thoại inbox)</span>
                  </span>
                  <span style={{ fontSize: 12 }}>
                    <Switch
                      size="small"
                      checked={useCpc}
                      onChange={setUseCpc}
                    />{" "}
                    <span style={{ color: "#0e7490" }}>Dùng CPC (click link)</span>
                  </span>
                  <span style={{ fontSize: 12 }}>
                    <Switch
                      size="small"
                      checked={pauseCampaignToo}
                      onChange={setPauseCampaignToo}
                    />{" "}
                    <span style={{ color: "#dc2626" }}>
                      Tắt luôn chiến dịch khi tắt nhóm
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#475569",
                background: "#fff",
                borderRadius: 8,
                padding: 10,
                border: "1px dashed #bae6fd",
              }}
            >
              💡 Nhóm bị tắt khi <b>ĐỒNG THỜI</b>: tiêu &gt; ngưỡng tiền <b>VÀ</b> giá
              /KQ &gt; ngưỡng giá <b>VÀ</b> CPM &gt; ngưỡng CPM. Khi số kết quả tăng
              lên, ngưỡng tiêu tự động được nâng thêm <b>ngưỡng giá × số KQ tăng</b>.
            </div>

            <Space style={{ marginTop: 12 }} wrap>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={saving}
                onClick={startMonitoring}
              >
                🚀 Lưu &amp; bắt đầu giám sát ({selectedKeys.length} nhóm)
              </Button>
              <Button danger loading={saving} onClick={stopMonitoring}>
                🛑 Dừng giám sát
              </Button>
              <Button
                icon={<ReloadOutlined />}
                loading={checking}
                onClick={runCheck}
                disabled={!running}
              >
                ♻️ Quét ngay
              </Button>
              <Tag color={running ? "green" : "default"} style={{ padding: "4px 10px" }}>
                Trạng thái: {running ? "ĐANG GIÁM SÁT" : "ĐÃ DỪNG"}
              </Tag>
            </Space>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#475569",
                background: "#fffbeb",
                border: "1px dashed #fcd34d",
                borderRadius: 8,
                padding: 10,
              }}
            >
              ⏱️ <b>Tự động chạy nền:</b> thêm cron gọi{" "}
              <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4 }}>
                GET {typeof window !== "undefined" ? window.location.origin : ""}
                /api/care-camp/check
              </code>{" "}
              mỗi 5–10 phút (Task Scheduler / Vercel Cron). Nếu đã cấu hình{" "}
              <code>REPORT_SECRET</code> thì thêm{" "}
              <code>?secret=...</code> hoặc header{" "}
              <code>x-report-secret</code>.
            </div>
          </div>

          {/* Bảng log */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>
              📜 Nhật ký tự động tắt / nâng ngưỡng
            </h3>
            <div style={{ flex: 1 }} />
            <Button size="small" icon={<ReloadOutlined />} onClick={loadLogs}>
              Làm mới
            </Button>
            <Popconfirm
              title="Xoá toàn bộ nhật ký?"
              onConfirm={async () => {
                await axios.delete(API_LOGS);
                loadLogs();
                message.success("Đã xoá nhật ký.");
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xoá log
              </Button>
            </Popconfirm>
          </div>
          <Table
            size="small"
            rowKey={(r) => r._id?.toString() || Math.random()}
            loading={logsLoading}
            columns={logColumns}
            dataSource={logs}
            pagination={{ pageSize: 10 }}
          />
        </div>
      )}
    </div>
  );
}
