// ============================================================================
// LÕI CARE CAMP — CHĂM SÓC CHIẾN DỊCH & BÁO CÁO TỰ ĐỘNG THEO NHÂN VIÊN
// ----------------------------------------------------------------------------
// TRIẾT LÝ
//   1. Mỗi NHÂN VIÊN có 1 cấu hình riêng trong collection `careCampEmployees`
//      (token, tài khoản QC, ngưỡng, nhóm đang giám sát).
//   2. Khi nhân viên DÙNG WEB (mở trang Care Camp, bấm "Tải nhóm", bắt đầu
//      giám sát, quét ngay) -> hệ thống TỰ ĐỘNG gom chỉ số từng nhóm vào
//      `careCampAdsetDaily` và LƯU báo cáo ngày vào `careCampDailyReports`.
//      => Nhân viên không phải làm gì thêm, cứ dùng web là có báo cáo.
//   3. ADMIN chỉ cần ĐỌC DB, không phải thiết lập tên/token/tài khoản.
//
// COLLECTIONS
//   careCampEmployees     : 1 doc / nhân viên (cấu hình + token + monitored)
//   careCampAdsetDaily    : 1 doc / (ngày + nhân viên + adset) — lịch sử chạy
//   careCampDailyReports  : 1 doc / (ngày + nhân viên) — báo cáo hoàn chỉnh
//   camp_settings         : cấu hình chung (fallback) + logs auto-pause
// ============================================================================

import { connectToDatabase } from "./mongodb.mjs";

// ---------------------------------------------------------------------------
// Hằng số
// ---------------------------------------------------------------------------

export const GRAPH = "https://graph.facebook.com/v20.0";
export const REPORT_TZ = "Asia/Ho_Chi_Minh";

const VN_UTC_OFFSET_MIN = 420; // VN cố định +7, không có DST

export const COL_EMPLOYEES = "careCampEmployees";
export const COL_ADSET_DAILY = "careCampAdsetDaily";
export const COL_REPORTS = "careCampDailyReports";
export const COL_SETTINGS = "camp_settings";
export const COL_LOGS = "camp_auto_logs";

/** Ngưỡng mặc định (giống extension) */
export const DEFAULT_LIMITS = {
  maxSpend: 10000,
  maxPrice: 12000,
  maxCpm: 50000,
};

/** Số mẫu timeline tối đa giữ cho 1 nhóm/ngày */
const MAX_TIMELINE = 500;

// ---------------------------------------------------------------------------
// Tiện ích ngày giờ
// ---------------------------------------------------------------------------

/** Ngày "YYYY-MM-DD" theo giờ Việt Nam. */
export function getVnDateStr(now = new Date()) {
  const shifted = new Date(now.getTime() + VN_UTC_OFFSET_MIN * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** Khoảng UTC của 1 ngày lịch theo giờ VN. */
export function getVnDayRange(dateStr) {
  const start =
    Date.parse(`${dateStr}T00:00:00.000Z`) - VN_UTC_OFFSET_MIN * 60 * 1000;
  return {
    start: new Date(start),
    end: new Date(start + 24 * 60 * 60 * 1000),
  };
}

/** "DD/MM/YYYY" */
export function formatVnDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-");
  return `${d}/${m}/${y}`;
}

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

export function formatVnd(value) {
  return Math.round(toNumber(value)).toLocaleString("vi-VN");
}

export function formatVndD(value) {
  return `${formatVnd(value)} đ`;
}

/** ms -> "2g 15p" */
export function formatDuration(ms) {
  const totalMin = Math.max(0, Math.round((toNumber(ms) || 0) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} phút`;
  return `${h}g ${String(m).padStart(2, "0")}p`;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Index MongoDB
// ---------------------------------------------------------------------------

const INDEX_SPECS = [
  {
    collection: COL_EMPLOYEES,
    keys: { employeeName: 1 },
    name: "employeeName_1",
  },
  {
    collection: COL_ADSET_DAILY,
    keys: { date: 1, employeeName: 1 },
    name: "date_1_employeeName_1",
  },
  {
    collection: COL_ADSET_DAILY,
    keys: { date: 1, adsetId: 1 },
    name: "date_1_adsetId_1",
  },
  {
    collection: COL_REPORTS,
    keys: { date: 1, employeeName: 1 },
    name: "date_1_employeeName_1",
  },
  {
    collection: COL_REPORTS,
    keys: { employeeName: 1, date: -1 },
    name: "employeeName_1_date_-1",
  },
];

export async function ensureCareCampIndexes(db) {
  const key = "__lmc_carecamp_indexes_ready";
  if (globalThis[key]) return globalThis[key];
  globalThis[key] = (async () => {
    for (const spec of INDEX_SPECS) {
      try {
        await db.collection(spec.collection).createIndex(spec.keys, {
          name: spec.name,
        });
      } catch (err) {
        console.warn(`[careCamp] Không tạo được index ${spec.name}:`, err?.message);
      }
    }
    return true;
  })();
  return globalThis[key];
}

/** Mở DB + tạo index. */
export async function withCareCampDb(fn) {
  const { db } = await connectToDatabase();
  await ensureCareCampIndexes(db);
  return fn(db);
}

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------

/** Cấu hình chung (fallback khi nhân viên chưa cấu hình riêng). */
export async function getGlobalSettings(db) {
  const doc = await db.collection(COL_SETTINGS).findOne({ _id: "global" });
  return {
    token: doc?.token || "",
    accounts: Array.isArray(doc?.accounts) ? doc.accounts : [],
    maxSpend: toNumber(doc?.maxSpend) || DEFAULT_LIMITS.maxSpend,
    maxPrice: toNumber(doc?.maxPrice) || DEFAULT_LIMITS.maxPrice,
    maxCpm: toNumber(doc?.maxCpm) || DEFAULT_LIMITS.maxCpm,
    useCpl: !!doc?.useCpl,
    useCpc: !!doc?.useCpc,
    pauseCampaignToo: !!doc?.pauseCampaignToo,
    running: !!doc?.running,
    monitored: Array.isArray(doc?.monitored) ? doc.monitored : [],
    prevResults: doc?.prevResults || {},
  };
}

/**
 * Lấy cấu hình của 1 nhân viên (đã merge với mặc định + thông tin từ
 * collection `employees`). Trả về null nếu nhân viên chưa từng dùng Care Camp.
 */
export async function getEmployeeSettings(db, employeeName) {
  const name = String(employeeName || "").trim();
  if (!name) return null;

  const all = await db.collection(COL_EMPLOYEES).find({}).toArray();
  const cfg =
    all.find((c) => norm(c.employeeName) === norm(name)) ||
    all.find((c) => norm(c.employeeName).startsWith(norm(name))) ||
    null;

  const emp = await db
    .collection("employees")
    .findOne(
      { name: { $regex: `^${escapeRegExp(name)}$`, $options: "i" } },
      {
        projection: {
          name: 1,
          employee_code: 1,
          username: 1,
          position: 1,
          position_team: 1,
          team_tp: 1,
          quocgia: 1,
        },
      },
    );

  const global = await getGlobalSettings(db);

  return {
    employeeName: emp?.name || cfg?.employeeName || name,
    employeeCode: emp?.employee_code ?? cfg?.employeeCode ?? null,
    username: emp?.username || cfg?.username || "",
    position: emp?.position || cfg?.position || "",
    positionTeam: emp?.position_team || cfg?.positionTeam || "",
    teamTp: emp?.team_tp || cfg?.teamTp || "",
    quocgia: emp?.quocgia || cfg?.quocgia || "kr",

    // Token: ưu tiên token riêng của nhân viên, không có thì dùng token chung
    token: cfg?.token || global.token || "",
    hasOwnToken: !!cfg?.token,

    accounts: Array.isArray(cfg?.accounts) ? cfg.accounts : [],
    monitored: Array.isArray(cfg?.monitored) ? cfg.monitored : [],
    prevResults: cfg?.prevResults || {},

    maxSpend: toNumber(cfg?.maxSpend) || global.maxSpend,
    maxPrice: toNumber(cfg?.maxPrice) || global.maxPrice,
    maxCpm: toNumber(cfg?.maxCpm) || global.maxCpm,
    useCpl: cfg?.useCpl ?? global.useCpl,
    useCpc: cfg?.useCpc ?? global.useCpc,
    pauseCampaignToo: cfg?.pauseCampaignToo ?? global.pauseCampaignToo,
    running: cfg?.running ?? false,

    createdAt: cfg?.createdAt || null,
    updatedAt: cfg?.updatedAt || null,
    inDirectory: !!emp,
  };
}

/** Lưu cấu hình của 1 nhân viên (upsert). */
export async function saveEmployeeSettings(db, employeeName, patch = {}) {
  const name = String(employeeName || "").trim();
  if (!name) throw new Error("Thiếu tên nhân viên");

  const set = { employeeName: name, updatedAt: new Date() };
  if (patch.token !== undefined) set.token = String(patch.token || "").trim();
  if (patch.accounts !== undefined) {
    set.accounts = (Array.isArray(patch.accounts) ? patch.accounts : [])
      .map((a) => ({
        id: String(a.id || "").replace(/^act_/i, "").trim(),
        name: String(a.name || "").trim() || String(a.id || "").trim(),
      }))
      .filter((a) => a.id);
  }
  if (patch.monitored !== undefined) {
    set.monitored = (Array.isArray(patch.monitored) ? patch.monitored : [])
      .map((m) => ({
        adsetId: String(m.adsetId || "").trim(),
        accountId: String(m.accountId || "").trim(),
        accountName: String(m.accountName || "").trim(),
        name: String(m.name || "").trim(),
        campaignName: String(m.campaignName || "").trim(),
        maxSpend: toNumber(m.maxSpend),
        maxPrice: toNumber(m.maxPrice),
        maxCpm: toNumber(m.maxCpm),
      }))
      .filter((m) => m.adsetId);
  }
  if (patch.prevResults !== undefined) set.prevResults = patch.prevResults;
  ["maxSpend", "maxPrice", "maxCpm"].forEach((k) => {
    if (patch[k] !== undefined) {
      const v = toNumber(patch[k]);
      if (v > 0) set[k] = v;
    }
  });
  ["useCpl", "useCpc", "pauseCampaignToo", "running"].forEach((k) => {
    if (typeof patch[k] === "boolean") set[k] = patch[k];
  });
  if (patch.note !== undefined) set.note = String(patch.note || "");

  await db
    .collection(COL_EMPLOYEES)
    .updateOne(
      { employeeName: name },
      { $set: set, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );

  return getEmployeeSettings(db, name);
}

/** Danh sách nhân viên đã từng dùng Care Camp (dùng cho admin). */
export async function listTrackedEmployees(db) {
  const configs = await db.collection(COL_EMPLOYEES).find({}).toArray();
  const rows = [];
  for (const cfg of configs) {
    const s = await getEmployeeSettings(db, cfg.employeeName);
    if (!s) continue;
    rows.push({
      employeeName: s.employeeName,
      employeeCode: s.employeeCode,
      username: s.username,
      position: s.position,
      positionTeam: s.positionTeam,
      teamTp: s.teamTp,
      quocgia: s.quocgia,
      hasToken: !!s.token,
      hasOwnToken: s.hasOwnToken,
      accountsCount: s.accounts.length,
      monitoredCount: s.monitored.length,
      running: s.running,
      updatedAt: s.updatedAt,
      inDirectory: s.inDirectory,
    });
  }
  return rows.sort((a, b) =>
    String(a.employeeName).localeCompare(String(b.employeeName), "vi"),
  );
}

// ---------------------------------------------------------------------------
// Gọi Meta Graph API
// ---------------------------------------------------------------------------

async function graphGet(path, token, params = {}) {
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), { method: "GET" });
  return res.json();
}

async function setMetaStatus(id, status, token) {
  const url = new URL(`${GRAPH}/${id}`);
  url.searchParams.set("status", status);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), { method: "POST" });
  return res.json();
}

/** Chuyển 1 adset raw -> metrics chuẩn hoá. */
export function extractMetrics(adset) {
  const insights = adset?.insights?.data?.[0] || null;
  let conversations = 0;
  const messAction = (insights?.actions || []).find((a) =>
    String(a.action_type || "").includes("messaging_conversation_started"),
  );
  if (messAction) conversations = toNumber(messAction.value);

  return {
    spend: toNumber(insights?.spend),
    impressions: toNumber(insights?.impressions),
    reach: toNumber(insights?.reach),
    cpm: toNumber(insights?.cpm),
    clicks: toNumber(insights?.clicks),
    inlineLinkClicks: toNumber(insights?.inline_link_clicks),
    conversations,
    results: conversations,
    resultType: "conversation",
  };
}

/**
 * Chọn chỉ số kết quả theo cấu hình:
 *   CPC (bật useCpc) > CPL (bật useCpl) > CPR (mặc định)
 */
export function pickResult(metrics, useCpl, useCpc, optimizationGoal = "") {
  if (useCpc && metrics.inlineLinkClicks > 0) {
    return { count: metrics.inlineLinkClicks, type: "cpc", label: "CPC (Click Link)" };
  }
  if (useCpl && metrics.conversations > 0) {
    return { count: metrics.conversations, type: "cpl", label: "CPL (Hội thoại)" };
  }
  if (metrics.conversations > 0) {
    return { count: metrics.conversations, type: "cpr", label: "CPR (Hội thoại)" };
  }
  if (optimizationGoal === "LINK_CLICKS" && metrics.inlineLinkClicks > 0) {
    return { count: metrics.inlineLinkClicks, type: "cpc", label: "CPC (Click Link)" };
  }
  return { count: 0, type: "cpr", label: "Hội thoại" };
}

// ---------------------------------------------------------------------------
// GOM CHỈ SỐ TỪNG NHÓM (SNAPSHOT) — tự động khi nhân viên dùng web
// ---------------------------------------------------------------------------

/**
 * Ghi 1 mẫu snapshot cho nhóm quảng cáo vào `careCampAdsetDaily`.
 *
 * Mỗi mẫu lưu trạng thái active/paused theo thời gian -> từ đó suy ra được
 * "nhóm đã chạy từ lúc nào" và "đã chạy bao lâu".
 *
 * @param {import('mongodb').Db} db
 * @param {object} params
 * @param {string} params.employeeName
 * @param {string} params.dateStr
 * @param {object} params.item - nhóm đã chuẩn hoá (id, name, metrics, ...)
 * @param {number} [params.nowMs]
 */
export async function recordAdsetSample(db, params) {
  const { employeeName, dateStr, item } = params;
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const adsetId = String(item.id || item.adsetId || "");
  if (!adsetId) return null;

  const col = db.collection(COL_ADSET_DAILY);
  const _id = `${dateStr}|${employeeName}|${adsetId}`;
  const existing = await col.findOne({ _id });

  const isActive = String(item.status || "").toUpperCase() === "ACTIVE";
  const prevSamples = Array.isArray(existing?.samples) ? existing.samples : [];
  const lastSample = prevSamples[prevSamples.length - 1] || null;

  // Timeline các mốc thời gian (t, s) — giữ tối đa MAX_TIMELINE mẫu
  const timeline = Array.isArray(existing?.timeline) ? [...existing.timeline] : [];
  timeline.push({ t: nowMs, s: isActive ? 1 : 0 });
  const trimmedTimeline =
    timeline.length > MAX_TIMELINE
      ? timeline.slice(timeline.length - MAX_TIMELINE)
      : timeline;

  // Cửa sổ hoạt động: [{from, to}]
  const windows = Array.isArray(existing?.activeWindows)
    ? existing.activeWindows.map((w) => ({ ...w }))
    : [];

  if (isActive) {
    if (lastSample && lastSample.s === 1 && windows.length) {
      windows[windows.length - 1].to = nowMs;
    } else {
      windows.push({ from: nowMs, to: nowMs });
    }
  } else if (lastSample && lastSample.s === 1 && windows.length) {
    // Vừa bị tắt -> đóng cửa sổ tại mốc cuối cùng còn active
    windows[windows.length - 1].to = lastSample.t;
  }

  const metrics = item.metrics || {};
  const prevMetrics = existing?.metrics || {};
  // Meta trả số liệu TÍCH LŨY trong ngày -> giữ giá trị cao nhất
  const merged = {
    spend: Math.max(toNumber(prevMetrics.spend), toNumber(metrics.spend)),
    impressions: Math.max(
      toNumber(prevMetrics.impressions),
      toNumber(metrics.impressions),
    ),
    reach: Math.max(toNumber(prevMetrics.reach), toNumber(metrics.reach)),
    clicks: Math.max(toNumber(prevMetrics.clicks), toNumber(metrics.clicks)),
    inlineLinkClicks: Math.max(
      toNumber(prevMetrics.inlineLinkClicks),
      toNumber(metrics.inlineLinkClicks),
    ),
    conversations: Math.max(
      toNumber(prevMetrics.conversations),
      toNumber(metrics.conversations),
    ),
    cpm: Math.max(toNumber(prevMetrics.cpm), toNumber(metrics.cpm)),
  };

  const doc = {
    _id,
    date: dateStr,
    employeeName,
    employeeCode: params.employeeCode ?? existing?.employeeCode ?? null,
    adsetId,
    adsetName: item.name || existing?.adsetName || "",
    adsetStatus: item.status || existing?.adsetStatus || "",
    optimizationGoal: item.optimizationGoal || existing?.optimizationGoal || "",
    dailyBudget: toNumber(item.dailyBudget),
    lifetimeBudget: toNumber(item.lifetimeBudget),
    campaignId: item.campaignId || existing?.campaignId || "",
    campaignName: item.campaignName || existing?.campaignName || "",
    accountId: item.accountId || existing?.accountId || "",
    accountName: item.accountName || existing?.accountName || "",
    active: isActive,
    firstSeenAt: existing?.firstSeenAt ?? nowMs,
    lastSeenAt: nowMs,
    firstActiveAt:
      existing?.firstActiveAt ?? (isActive ? nowMs : null),
    lastActiveAt: isActive ? nowMs : existing?.lastActiveAt ?? null,
    samples: [...prevSamples, { t: nowMs, s: isActive ? 1 : 0 }].slice(-MAX_TIMELINE),
    timeline: trimmedTimeline,
    activeWindows: windows,
    metrics: merged,
    updatedAt: new Date(nowIso),
  };

  await col.updateOne({ _id }, { $set: doc }, { upsert: true });
  return doc;
}

/**
 * Gom snapshot cho 1 danh sách nhóm của nhân viên (dùng khi nhân viên mở web).
 *
 * @param {import('mongodb').Db} db
 * @param {object} settings - cấu hình nhân viên (đã lấy từ getEmployeeSettings)
 * @param {Array} items - danh sách nhóm đã chuẩn hoá
 * @param {string} dateStr
 */
export async function recordEmployeeSamples(db, settings, items, dateStr) {
  const saved = [];
  for (const item of items || []) {
    const doc = await recordAdsetSample(db, {
      employeeName: settings.employeeName,
      employeeCode: settings.employeeCode,
      dateStr,
      item,
    });
    if (doc) saved.push(doc);
  }
  return saved;
}

/**
 * Đóng cửa sổ "đang chạy" cho các nhóm đã theo dõi từ trước nhưng KHÔNG còn
 * xuất hiện trong lần quét mới (đã bị tắt / hết phân phối).
 *
 * Nhờ vậy "thời gian nhóm hoạt động" trong báo cáo không bị cộng dồn vô tận
 * cho nhóm đã ngừng chạy.
 *
 * @param {import('mongodb').Db} db
 * @param {object} settings
 * @param {Array} items - danh sách nhóm vừa quét (đã chuẩn hoá)
 * @param {string} dateStr
 */
export async function closeStaleAdsetWindows(db, settings, items, dateStr, opts = {}) {
  const employeeName = settings?.employeeName;
  if (!employeeName) return [];

  const currentIds = new Set(
    (items || []).map((it) => String(it.id || it.adsetId || "")),
  );
  // Chỉ đóng cửa sổ cho nhóm thuộc tài khoản đã quét OK (tránh đóng nhầm
  // khi một tài khoản bị lỗi mạng / token hết hạn).
  const okAccountIds = opts.okAccountIds ? new Set(opts.okAccountIds) : null;

  const col = db.collection(COL_ADSET_DAILY);
  const tracked = await col
    .find({ date: dateStr, employeeName, active: true })
    .toArray();

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const closed = [];

  for (const doc of tracked) {
    if (currentIds.has(String(doc.adsetId))) continue;
    if (okAccountIds && !okAccountIds.has(String(doc.accountId || ""))) continue;

    const prevSamples = Array.isArray(doc.samples) ? doc.samples : [];
    const lastSample = prevSamples[prevSamples.length - 1] || null;

    const windows = Array.isArray(doc.activeWindows)
      ? doc.activeWindows.map((w) => ({ ...w }))
      : [];
    if (lastSample && lastSample.s === 1 && windows.length) {
      windows[windows.length - 1].to = lastSample.t;
    }

    const samples = [...prevSamples, { t: nowMs, s: 0 }].slice(-MAX_TIMELINE);
    const timeline = Array.isArray(doc.timeline) ? [...doc.timeline] : [];
    timeline.push({ t: nowMs, s: 0 });
    const trimmedTimeline =
      timeline.length > MAX_TIMELINE
        ? timeline.slice(timeline.length - MAX_TIMELINE)
        : timeline;

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          active: false,
          adsetStatus: "PAUSED",
          status: "PAUSED",
          activeWindows: windows,
          samples,
          timeline: trimmedTimeline,
          lastSeenAt: nowIso,
          updatedAt: nowIso,
        },
      },
    );
    closed.push(doc.adsetId);
  }

  return closed;
}

// ---------------------------------------------------------------------------
// Tính thời gian hoạt động của nhóm
// ---------------------------------------------------------------------------

/**
 * Tính tổng thời gian nhóm thực sự "đang chạy" trong ngày.
 *
 * @param {Array<{from:number,to:number}>} windows - các cửa sổ hoạt động
 * @param {number} [nowMs]
 * @returns {{minutes:number, firstActiveAt:number|null, lastActiveAt:number|null}}
 */
export function computeActiveWindow(windows, nowMs = Date.now()) {
  const list = (Array.isArray(windows) ? windows : [])
    .filter((w) => w && Number.isFinite(Number(w.from)))
    .map((w) => ({
      from: Number(w.from),
      to: Number.isFinite(Number(w.to)) ? Number(w.to) : nowMs,
    }))
    .sort((a, b) => a.from - b.from);

  if (!list.length) {
    return { minutes: 0, firstActiveAt: null, lastActiveAt: null };
  }

  let ms = 0;
  for (const w of list) {
    const to = Math.max(w.to, w.from);
    ms += to - w.from;
  }

  return {
    minutes: Math.round(ms / 60000),
    firstActiveAt: list[0].from,
    lastActiveAt: list[list.length - 1].to,
  };
}

// ---------------------------------------------------------------------------
// BÁO CÁO NGÀY CHO 1 NHÂN VIÊN
// ---------------------------------------------------------------------------

/**
 * Dựng báo cáo ngày cho 1 nhân viên từ dữ liệu snapshot trong ngày.
 *
 * @param {import('mongodb').Db} db
 * @param {string} employeeName
 * @param {string} dateStr
 * @param {object} [opts]
 */
export async function buildEmployeeDailyReport(db, employeeName, dateStr, opts = {}) {
  const settings = opts.settings || (await getEmployeeSettings(db, employeeName));
  const useCpl = settings?.useCpl ?? false;
  const useCpc = settings?.useCpc ?? false;

  const docs = await db
    .collection(COL_ADSET_DAILY)
    .find({ date: dateStr, employeeName })
    .toArray();

  const adsets = docs
    .map((doc) => {
      const m = doc.metrics || {};
      const result = pickResult(
        {
          inlineLinkClicks: toNumber(m.inlineLinkClicks),
          conversations: toNumber(m.conversations),
        },
        useCpl,
        useCpc,
        doc.optimizationGoal,
      );
      const spend = toNumber(m.spend);
      const costPerResult = result.count > 0 ? Math.round(spend / result.count) : 0;
      const win = computeActiveWindow(doc.activeWindows, opts.nowMs ?? Date.now());

      return {
        adsetId: doc.adsetId,
        adsetName: doc.adsetName,
        adsetStatus: doc.adsetStatus,
        optimizationGoal: doc.optimizationGoal,
        campaignId: doc.campaignId,
        campaignName: doc.campaignName,
        accountId: doc.accountId,
        accountName: doc.accountName,
        status: doc.active ? "ACTIVE" : "PAUSED",
        spend,
        impressions: toNumber(m.impressions),
        reach: toNumber(m.reach),
        clicks: toNumber(m.clicks),
        inlineLinkClicks: toNumber(m.inlineLinkClicks),
        conversations: toNumber(m.conversations),
        cpm: toNumber(m.cpm),
        results: result.count,
        resultType: result.type,
        resultLabel: result.label,
        costPerResult,
        dailyBudget: toNumber(doc.dailyBudget),
        lifetimeBudget: toNumber(doc.lifetimeBudget),
        // Thời gian hoạt động
        activeMinutes: win.minutes,
        activeDuration: formatDuration(win.minutes * 60000),
        firstActiveAt: win.firstActiveAt ? new Date(win.firstActiveAt) : null,
        lastActiveAt: win.lastActiveAt ? new Date(win.lastActiveAt) : null,
        firstSeenAt: doc.firstSeenAt ? new Date(doc.firstSeenAt) : null,
        lastSeenAt: doc.lastSeenAt ? new Date(doc.lastSeenAt) : null,
      };
    })
    .sort(
      (a, b) => b.spend - a.spend || a.adsetName.localeCompare(b.adsetName, "vi"),
    );

  const activeAdsets = adsets.filter((a) => a.status === "ACTIVE");

  // Gom theo tài khoản QC
  const accMap = new Map();
  for (const a of adsets) {
    const key = a.accountId || "";
    if (!accMap.has(key)) {
      accMap.set(key, {
        accountId: key,
        accountName: a.accountName || key,
        spend: 0,
        adsetCount: 0,
        activeAdsetCount: 0,
        results: 0,
      });
    }
    const row = accMap.get(key);
    row.spend += a.spend;
    row.adsetCount += 1;
    if (a.status === "ACTIVE") row.activeAdsetCount += 1;
    row.results += a.results;
  }
  const accounts = [...accMap.values()].sort((a, b) => b.spend - a.spend);

  const totalSpend = adsets.reduce((s, a) => s + a.spend, 0);
  const totalResults = adsets.reduce((s, a) => s + a.results, 0);
  const totalImpressions = adsets.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = adsets.reduce((s, a) => s + a.clicks, 0);
  const totalActiveMinutes = adsets.reduce((s, a) => s + a.activeMinutes, 0);
  const avgCost = totalResults > 0 ? Math.round(totalSpend / totalResults) : 0;
  const cpmAvg =
    totalImpressions > 0 ? Math.round((totalSpend / totalImpressions) * 1000) : 0;

  return {
    date: dateStr,
    dateLabel: formatVnDate(dateStr),
    generatedAt: new Date().toISOString(),
    employeeName: settings?.employeeName || employeeName,
    employeeCode: settings?.employeeCode ?? null,
    position: settings?.position || "",
    teamTp: settings?.teamTp || "",
    quocgia: settings?.quocgia || "kr",
    mode: {
      useCpl,
      useCpc,
      label: useCpc
        ? "CPC (Click Link)"
        : useCpl
          ? "CPL (Hội thoại)"
          : "CPR (Hội thoại)",
    },
    summary: {
      totalAdsets: adsets.length,
      activeAdsets: activeAdsets.length,
      pausedAdsets: adsets.length - activeAdsets.length,
      adsetNames: activeAdsets.map((a) => a.adsetName).filter(Boolean),
      totalSpend,
      totalResults,
      avgCostPerResult: avgCost,
      totalImpressions,
      totalClicks,
      cpmAvg,
      accountsCount: accounts.length,
      activeMinutes: totalActiveMinutes,
      activeDuration: formatDuration(totalActiveMinutes * 60000),
    },
    accounts,
    adsets,
  };
}

/**
 * Dựng + LƯU báo cáo ngày cho 1 nhân viên vào DB.
 * Đây là hàm được gọi tự động mỗi khi nhân viên dùng web.
 */
export async function saveEmployeeDailyReport(db, employeeName, dateStr, opts = {}) {
  const payload = await buildEmployeeDailyReport(db, employeeName, dateStr, opts);
  const now = new Date();
  await db.collection(COL_REPORTS).updateOne(
    { date: dateStr, employeeName: payload.employeeName },
    {
      $set: {
        date: dateStr,
        employeeName: payload.employeeName,
        employeeCode: payload.employeeCode,
        payload,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  return payload;
}

/** Dựng + lưu báo cáo cho TẤT CẢ nhân viên (dùng cho cron). */
export async function buildAndSaveDailyReports(db, dateStr = getVnDateStr()) {
  const employees = await listTrackedEmployees(db);
  const saved = [];
  const errors = [];

  for (const emp of employees) {
    try {
      const payload = await saveEmployeeDailyReport(db, emp.employeeName, dateStr);
      saved.push({
        employeeName: emp.employeeName,
        totalAdsets: payload.summary.totalAdsets,
        activeAdsets: payload.summary.activeAdsets,
        totalSpend: payload.summary.totalSpend,
        totalResults: payload.summary.totalResults,
      });
    } catch (err) {
      errors.push({
        employeeName: emp.employeeName,
        error: err?.message || "Lỗi không xác định",
      });
    }
  }

  return { date: dateStr, at: new Date().toISOString(), saved, errors };
}

/** Đọc các báo cáo đã lưu (admin chỉ cần gọi hàm này). */
export async function listSavedReports(db, { date, employeeName, limit = 200 } = {}) {
  const query = {};
  if (date) query.date = date;
  if (employeeName) query.employeeName = employeeName;

  const docs = await db
    .collection(COL_REPORTS)
    .find(query)
    .sort({ date: -1, employeeName: 1 })
    .limit(limit)
    .toArray();

  return docs.map((d) => ({
    id: `${d.date}|${d.employeeName}`,
    date: d.date,
    employeeName: d.employeeName,
    employeeCode: d.employeeCode ?? null,
    updatedAt: d.updatedAt,
    payload: d.payload,
  }));
}

/** Lấy 1 báo cáo đã lưu. */
export async function getSavedReport(db, employeeName, dateStr) {
  const doc = await db
    .collection(COL_REPORTS)
    .findOne({ date: dateStr, employeeName });
  return doc?.payload || null;
}

/** Danh sách các ngày có báo cáo. */
export async function listReportDates(db, limit = 60) {
  const rows = await db
    .collection(COL_REPORTS)
    .aggregate([
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: limit },
    ])
    .toArray();
  return rows.map((r) => ({ date: r._id, count: r.count }));
}

// ---------------------------------------------------------------------------
// TỰ ĐỘNG TẮT THEO NGƯỠNG (AUTO-PAUSE)
// ---------------------------------------------------------------------------

/**
 * Kiểm tra & tự động tắt các nhóm đang giám sát của 1 nhân viên.
 *
 * Điều kiện tắt (giống extension): tiêu > maxSpend VÀ giá/KQ > maxPrice
 * VÀ CPM > maxCpm (đồng thời cả 3).
 */
export async function autoPauseEmployee(db, settings) {
  const token = (settings.token || "").trim();
  const monitored = Array.isArray(settings.monitored) ? settings.monitored : [];
  const actions = [];

  if (!token || !monitored.length) return { actions, monitored };

  const useCpl = settings.useCpl;
  const useCpc = settings.useCpc;
  const pauseCampaignToo = settings.pauseCampaignToo;

  const stillMonitored = [];
  const nextResults = {};

  for (const m of monitored) {
    const adsetId = String(m.adsetId || "");
    if (!adsetId) continue;

    const limitSpend = toNumber(m.maxSpend) > 0 ? toNumber(m.maxSpend) : settings.maxSpend;
    const limitPrice = toNumber(m.maxPrice) > 0 ? toNumber(m.maxPrice) : settings.maxPrice;
    const limitCpm = toNumber(m.maxCpm) > 0 ? toNumber(m.maxCpm) : settings.maxCpm;

    let adset;
    try {
      const res = await graphGet(`/${adsetId}`, token, {
        fields:
          "name,status,effective_status,optimization_goal,campaign{id,name},insights.date_preset(today){spend,impressions,reach,cpm,clicks,inline_link_clicks,actions}",
      });
      if (res?.error) {
        actions.push({
          employeeName: settings.employeeName,
          adsetId,
          name: m.name,
          type: "error",
          message: res.error.message || "Lỗi Graph API",
        });
        stillMonitored.push(m);
        continue;
      }
      adset = res;
    } catch (err) {
      actions.push({
        employeeName: settings.employeeName,
        adsetId,
        name: m.name,
        type: "error",
        message: err?.message || "Lỗi mạng",
      });
      stillMonitored.push(m);
      continue;
    }

    const metrics = extractMetrics(adset);
    const result = pickResult(metrics, useCpl, useCpc, adset.optimization_goal);
    const price = result.count > 0 ? Math.round(metrics.spend / result.count) : 0;
    const cpc =
      metrics.inlineLinkClicks > 0
        ? Math.round(metrics.spend / metrics.inlineLinkClicks)
        : 0;

    // Tự nâng ngưỡng tiêu khi số KQ tăng
    const prev = settings.prevResults?.[adsetId];
    let currentMaxSpend = limitSpend;
    nextResults[adsetId] = result.count;
    if (prev !== undefined && result.count > prev) {
      const diff = result.count - prev;
      currentMaxSpend = limitSpend + limitPrice * diff;
      actions.push({
        employeeName: settings.employeeName,
        adsetId,
        name: adset.name || m.name,
        type: "raise",
        message: `Nâng ngưỡng tiêu ${formatVnd(limitSpend)}đ → ${formatVnd(currentMaxSpend)}đ (+${diff} KQ, ${result.label})`,
      });
    }

    const priceBreached = result.count === 0 || price > limitPrice;
    const cpcBreached = useCpc
      ? metrics.inlineLinkClicks === 0 || cpc > limitPrice
      : priceBreached;

    if (
      metrics.spend > currentMaxSpend &&
      (useCpc ? cpcBreached : priceBreached) &&
      metrics.cpm > limitCpm
    ) {
      const reason = useCpc
        ? metrics.inlineLinkClicks === 0
          ? "Không có click link"
          : `CPC ${formatVnd(cpc)}đ > ${formatVnd(limitPrice)}đ`
        : result.count === 0
          ? "Không có kết quả (hội thoại/click)"
          : `Giá ${formatVnd(price)}đ > ${formatVnd(limitPrice)}đ`;

      try {
        const pauseRes = await setMetaStatus(adsetId, "PAUSED", token);
        if (pauseRes?.success) {
          let campaignPaused = false;
          if (pauseCampaignToo && adset.campaign?.id) {
            const cRes = await setMetaStatus(adset.campaign.id, "PAUSED", token);
            campaignPaused = !!cRes?.success;
          }
          actions.push({
            employeeName: settings.employeeName,
            adsetId,
            name: adset.name || m.name,
            campaignName: adset.campaign?.name,
            type: "pause",
            spend: metrics.spend,
            price,
            cpm: metrics.cpm,
            result: result.count,
            resultLabel: result.label,
            reason,
            campaignPaused,
            message: `ĐÃ TẮT nhóm "${adset.name || m.name}"${
              campaignPaused ? ` + chiến dịch "${adset.campaign?.name}"` : ""
            } — ${reason}`,
          });
          // Không giám sát lại nhóm vừa tắt
          continue;
        }
        actions.push({
          employeeName: settings.employeeName,
          adsetId,
          name: adset.name || m.name,
          type: "error",
          message: pauseRes?.error?.message || "Không tắt được nhóm",
        });
      } catch (err) {
        actions.push({
          employeeName: settings.employeeName,
          adsetId,
          name: adset.name || m.name,
          type: "error",
          message: err?.message || "Lỗi khi tắt nhóm",
        });
      }
    }

    stillMonitored.push({
      ...m,
      name: adset.name || m.name,
      campaignName: adset.campaign?.name || m.campaignName,
      maxSpend: currentMaxSpend,
      maxPrice: limitPrice,
      maxCpm: limitCpm,
    });
  }

  await saveEmployeeSettings(db, settings.employeeName, {
    monitored: stillMonitored,
    prevResults: { ...(settings.prevResults || {}), ...nextResults },
  });

  return { actions, monitored: stillMonitored };
}

/** Chạy auto-pause cho TẤT CẢ nhân viên (dùng cho cron). */
export async function autoPauseAll(db) {
  const employees = await listTrackedEmployees(db);
  const allActions = [];

  for (const emp of employees) {
    const settings = await getEmployeeSettings(db, emp.employeeName);
    if (!settings?.running) continue;
    if (!Array.isArray(settings.monitored) || !settings.monitored.length) continue;
    try {
      const { actions } = await autoPauseEmployee(db, settings);
      allActions.push(...actions);
    } catch (err) {
      allActions.push({
        employeeName: emp.employeeName,
        type: "error",
        message: err?.message || "Lỗi không xác định",
      });
    }
  }

  if (allActions.length) {
    await db
      .collection(COL_LOGS)
      .insertMany(allActions.map((a) => ({ ...a, createdAt: new Date() })));
  }

  return allActions;
}

// ---------------------------------------------------------------------------
// LẤY DANH SÁCH NHÓM CHO NHÂN VIÊN (dùng chung UI + cron)
// ---------------------------------------------------------------------------

/**
 * Lấy danh sách nhóm quảng cáo đang chạy (hoặc đã tắt) của các tài khoản
 * mà nhân viên đã nhập, kèm chỉ số hôm nay.
 *
 * @param {string[]} accountIds
 * @param {string} token
 * @param {string} dateStr
 * @param {"adsets"|"campaigns"} type
 */
export async function fetchAdItems(accountIds, token, dateStr, type = "adsets") {
  const isCampaign = type === "campaigns";
  const out = [];

  for (const accId of accountIds) {
    const accountId = String(accId).replace(/^act_/i, "");
    if (!accountId) continue;

    // Meta Graph API yêu cầu tiền tố "act_" cho ad account (trừ khi gọi me/adaccounts)
    const actId = `act_${accountId}`;

    let accountName = accountId;
    try {
      const accRes = await graphGet(`/${actId}`, token, { fields: "name" });
      if (accRes?.name) accountName = accRes.name;
    } catch {
      // bỏ qua, dùng accountId làm tên
    }

    // KHÔNG encodeURIComponent ở đây: graphGet dùng URLSearchParams.set (tự encode)
    // ACTIVE = nhóm đang chạy. Nhóm "đang phân phối" (có tiêu hôm nay) sẽ
    // được lọc thêm ở bước map bên dưới (giống extension).
    const filtering = JSON.stringify([
      { field: "effective_status", operator: "IN", value: ["ACTIVE"] },
    ]);

    const fields = isCampaign
      ? "id,name,status,effective_status,daily_budget,lifetime_budget,insights.date_preset(today){spend,impressions,reach,cpm,clicks,inline_link_clicks,actions}"
      : "id,name,status,effective_status,optimization_goal,daily_budget,lifetime_budget,start_time,stop_time,campaign{id,name},insights.date_preset(today){spend,impressions,reach,cpm,clicks,inline_link_clicks,actions}";

    const path = isCampaign ? `/${actId}/campaigns` : `/${actId}/adsets`;
    const res = await graphGet(path, token, { fields, filtering, limit: 500 });

    if (res?.error) {
      out.push({
        accountId,
        accountName,
        error: res.error.message,
        items: [],
      });
      continue;
    }

    // Chỉ giữ nhóm ĐANG PHÂN PHỐI (đã có tiêu/hiển thị hôm nay).
    // Giống extension: `if (!insights || parseFloat(insights.spend) === 0) continue;`
    const items = (res.data || [])
      .map((node) => {
        const metrics = extractMetrics(node);
        return {
          id: node.id,
          name: node.name,
          status: node.effective_status || node.status,
          optimizationGoal: node.optimization_goal || "",
          dailyBudget: toNumber(node.daily_budget),
          lifetimeBudget: toNumber(node.lifetime_budget),
          startTime: node.start_time || null,
          stopTime: node.stop_time || null,
          campaignId: node.campaign?.id || "",
          campaignName: node.campaign?.name || "",
          accountId,
          accountName,
          metrics,
          // Đang phân phối = đã tiêu tiền HOẶC đã có hiển thị hôm nay
          delivering: metrics.spend > 0 || metrics.impressions > 0,
        };
      })
      .filter((it) => it.delivering);

    out.push({ accountId, accountName, error: null, items });
  }

  return out;
}
