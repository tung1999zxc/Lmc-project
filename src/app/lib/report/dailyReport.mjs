// ============================================================================
// LÕI BÁO CÁO NGÀY (Daily Report Core)
// ----------------------------------------------------------------------------
// Module thuần ESM, KHÔNG phụ thuộc Next.js -> có thể import từ:
//   - API route:  src/app/api/report/daily/route.js
//   - Script node: scripts/send-daily-report.mjs
//
// Nguyên tắc thiết kế:
//   1. Chỉ đọc dữ liệu tối thiểu cần thiết (projection + filter server-side).
//   2. Tự build chuỗi ngày "YYYY-MM-DD" theo múi giờ VN, KHÔNG dùng preset
//      có sẵn (vì preset đang bị lệch 1 ngày do toISOString() -> UTC).
//   3. Kết quả được cache trong collection `dailyReports` (1 doc / ngày) để
//      lần gọi sau không phải query lại MongoDB.
// ============================================================================

import { connectToDatabase } from "../mongodb.mjs";

// ---------------------------------------------------------------------------
// Hằng số cấu hình
// ---------------------------------------------------------------------------

/** Tỷ giá quy đổi KRW -> VND (giống hệt app đang dùng ở page.js / mkt/page.js) */
export const EXCHANGE_RATE = 17000;

/** Offset giờ Việt Nam so với UTC (phút). VN không có DST nên cố định +7. */
const VN_UTC_OFFSET_MIN = 420;

/** Múi giờ dùng để hiển thị / tính "ngày hôm nay" */
export const REPORT_TZ = "Asia/Ho_Chi_Minh";

/** Thời gian cache payload (ms) */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** Các team_tp được theo dõi trong báo cáo */
export const TRACKED_TEAMS = ["DIEN", "PHI"];

/** Nhãn hiển thị cho team */
export const TEAM_LABELS = {
  DIEN: "TEAM DIEN",
  PHI: "TEAM PHI",
};

/** Chức danh MKT được xếp hạng (cao nhất / thấp nhất).
 *  Lãnh đạo (managerMKT, admin) vẫn được tính vào TỔNG doanh số team,
 *  nhưng không xếp hạng để tránh gây hiểu lầm. */
const RANKABLE_MKT_POSITIONS = ["mkt", "lead"];

/** Chức danh sale được xếp hạng doanh số nhập đơn */
const RANKABLE_SALE_POSITION = "salenhapdon";

/** Số người liệt kê mỗi team cho bảng xếp hạng */
export const TOP_N = 2;

/** Hệ số quy đổi doanh số khi tính % ADS.
 *  Giống công thức đang dùng ở src/app/mkt/page.js:
 *  doanh số trước khi × EXCHANGE_RATE được nhân thêm 0.95. */
export const ADS_SALES_RATIO = 0.95;

// ---------------------------------------------------------------------------
// Tiện ích ngày giờ
// ---------------------------------------------------------------------------

/**
 * Lấy ngày "hôm nay" theo giờ Việt Nam dưới dạng chuỗi "YYYY-MM-DD".
 * Không dùng `new Date().toISOString().slice(0,10)` vì đó là UTC
 * (sẽ ra hôm trước ở khoảng 00:00-07:00 giờ VN).
 */
export function getVnToday(now = new Date()) {
  const shifted = new Date(now.getTime() + VN_UTC_OFFSET_MIN * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Khoảng thời gian UTC của 1 ngày lịch theo giờ VN.
 * Trả về Date UTC tương ứng 00:00:00 và 00:00:00 ngày kế tiếp (giờ VN).
 */
export function getVnDayRange(dateStr) {
  const start =
    Date.parse(`${dateStr}T00:00:00.000Z`) - VN_UTC_OFFSET_MIN * 60 * 1000;
  return {
    start: new Date(start),
    end: new Date(start + 24 * 60 * 60 * 1000),
  };
}

/** Chuỗi ngày dạng "DD/MM/YYYY" để hiển thị */
export function formatVnDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-");
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Tiện ích số / chuỗi
// ---------------------------------------------------------------------------

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Định dạng tiền kiểu Việt Nam, có dấu phân cách nghìn */
export function formatVnd(value) {
  return Math.round(toNumber(value)).toLocaleString("vi-VN");
}

/** Định dạng tiền kèm đơn vị "đ" */
export function formatVndD(value) {
  return `${formatVnd(value)} đ`;
}

/**
 * Tính % ADS: ADS đã xin / (doanh số × ADS_SALES_RATIO).
 *
 * @param {number} adsCost - tổng ADS đã xin (VND)
 * @param {number} sales   - doanh số gốc (chưa × EXCHANGE_RATE)
 * @returns {number} phần trăm (0 khi doanh số = 0)
 */
export function computePercentAds(adsCost, sales) {
  const base = toNumber(sales) * EXCHANGE_RATE * ADS_SALES_RATIO;
  if (base <= 0) return 0;
  return (toNumber(adsCost) / base) * 100;
}

// ---------------------------------------------------------------------------
// Index MongoDB (idempotent, chạy 1 lần / process)
// ---------------------------------------------------------------------------

const INDEX_SPECS = [
  { collection: "pageName", keys: { createdAt: 1 }, name: "createdAt_1" },
  { collection: "recordsSale", keys: { date: 1 }, name: "date_1" },
  {
    collection: "recordsSale",
    keys: { date: 1, employeeName: 1 },
    name: "date_1_employeeName_1",
  },
  // Truy vấn đếm "đơn mới" (đơn được tạo trong ngày theo giờ VN)
  { collection: "orders", keys: { createdAt: 1 }, name: "createdAt_1" },
  // Truy vấn đếm "đơn đã gửi hàng" (shippingDate1 = ngày gửi hàng)
  { collection: "orders", keys: { shippingDate1: 1 }, name: "shippingDate1_1" },
  // Truy vấn chi phí ADS theo ngày (recordsMKT)
  { collection: "recordsMKT", keys: { date: 1 }, name: "date_1" },
];

/**
 * Đảm bảo có index cho các truy vấn báo cáo.
 * - createIndex là idempotent: nếu index đã tồn tại thì server trả về ngay.
 * - Chỉ chạy 1 lần cho mỗi process (cache bằng globalThis) nên không tốn
 *   request mỗi lần gọi API.
 */
export async function ensureReportIndexes(db) {
  const key = "__lmc_report_indexes_ready";
  if (globalThis[key]) return globalThis[key];

  globalThis[key] = (async () => {
    for (const spec of INDEX_SPECS) {
      try {
        await db.collection(spec.collection).createIndex(spec.keys, {
          name: spec.name,
        });
      } catch (err) {
        // Không được phép làm hỏng cả báo cáo chỉ vì index lỗi
        console.warn(
          `[dailyReport] Không tạo được index ${spec.name} trên ${spec.collection}:`,
          err?.message,
        );
      }
    }
    return true;
  })();

  return globalThis[key];
}

// ---------------------------------------------------------------------------
// Lõi tính toán
// ---------------------------------------------------------------------------

/**
 * Tính toàn bộ số liệu báo cáo cho 1 ngày.
 *
 * @param {import('mongodb').Db} db
 * @param {string} dateStr  "YYYY-MM-DD" (ngày lịch theo giờ VN)
 * @returns {Promise<Object>} payload báo cáo
 */
export async function buildDailyReport(db, dateStr) {
  const dayStart = Date.now();

  // 1) Nhân viên: load 1 lần (85 docs) dùng cho cả 6 chỉ số
  const employees = await db
    .collection("employees")
    .find(
      {},
      {
        projection: {
          name: 1,
          position: 1,
          position_team: 1,
          team_tp: 1,
          team_id: 1,
          status: 1,
        },
      },
    )
    .toArray();

  const empByName = new Map();
  for (const emp of employees) {
    const key = norm(emp.name);
    if (key && !empByName.has(key)) empByName.set(key, emp);
  }

  // 2) Đơn hàng trong ngày (có index orderDate_1_* -> prefix orderDate dùng được)
  const orders = await db
    .collection("orders")
    .find(
      { orderDate: dateStr },
      {
        projection: {
          _id: 0,
          mkt: 1,
          sale: 1,
          profit: 1,
          profitmkt: 1,
          revenue: 1,
        },
      },
    )
    .toArray();

  // 3) Số page mới tạo trong ngày (dựa trên createdAt theo giờ VN)
  const { start: dayStartUtc, end: dayEndUtc } = getVnDayRange(dateStr);
  const pageNew = await db
    .collection("pageName")
    .aggregate([
      { $match: { createdAt: { $gte: dayStartUtc, $lt: dayEndUtc } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
        },
      },
    ])
    .toArray();

  // 3b) Số ĐƠN MỚI tạo trong ngày (createdAt trong khoảng giờ VN).
  //      Đếm theo createdAt (lúc nhập đơn), KHÁC với `orders.length` (đơn
  //      có orderDate = ngày đó, gồm cả đơn nhập từ hôm trước).
  const newOrdersAgg = await db
    .collection("orders")
    .aggregate([
      { $match: { createdAt: { $gte: dayStartUtc, $lt: dayEndUtc } } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ])
    .toArray();

  // 3b2) Số ĐƠN ĐÃ GỬI HÀNG trong ngày.
  //      `shippingDate1` = ngày kho gửi hàng cho khách, lưu dạng chuỗi
  //      "YYYY-MM-DD" (không phải kiểu Date trong MongoDB).
  //      Đếm theo shippingDate1 = ngày đang báo cáo (không theo createdAt).
  const shippedOrdersCount = await db
    .collection("orders")
    .countDocuments({ shippingDate1: dateStr });

  // 3c) Tách nhóm đơn mới theo sale nhập đơn (position = salenhapdon)
  const newOrdersBySale = await db
    .collection("orders")
    .aggregate([
      { $match: { createdAt: { $gte: dayStartUtc, $lt: dayEndUtc } } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: { $ifNull: ["$sale", ""] } } } },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();

  const newSaleCounts = [];
  for (const row of newOrdersBySale) {
    if (!row._id) continue;
    const emp = empByName.get(row._id);
    if (!emp) continue;
    if (String(emp.position || "").toLowerCase() !== RANKABLE_SALE_POSITION) {
      continue;
    }
    newSaleCounts.push({
      name: emp.name,
      orders: row.count,
    });
  }

  // 4) Tổng newMess của tất cả nhân viên sale trong ngày
  const messAgg = await db
    .collection("recordsSale")
    .aggregate([
      { $match: { date: dateStr } },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$newMess", 0] } },
          records: { $sum: 1 },
        },
      },
    ])
    .toArray();

  // ----- Tính doanh số MKT -------------------------------------------------
  // Công thức giống bảng "Báo cáo MKT": sum(profitmkt ?? profit)
  const mktSales = new Map(); // key = name chuẩn hóa
  const teamTotals = { DIEN: 0, PHI: 0 };
  let unmatchedMktOrders = 0;

  for (const order of orders) {
    const mktName = norm(order.mkt);
    if (!mktName) continue;

    const emp = empByName.get(mktName);
    if (!emp) {
      unmatchedMktOrders += 1;
      continue;
    }
    // Chỉ tính nhóm MKT thuộc 2 team được theo dõi
    if (emp.position_team !== "mkt") continue;
    const teamTp = String(emp.team_tp || "").toUpperCase();
    if (!TRACKED_TEAMS.includes(teamTp)) continue;

    const value = toNumber(order.profitmkt ?? order.profit);

    // Tổng doanh số team: tính TẤT CẢ (kể cả lãnh đạo)
    teamTotals[teamTp] += value;

    if (!mktSales.has(mktName)) {
      mktSales.set(mktName, {
        name: emp.name,
        team_tp: teamTp,
        position: emp.position,
        sales: 0,
        orders: 0,
      });
    }
    const row = mktSales.get(mktName);
    row.sales += value;
    row.orders += 1;
  }

  // ----- Chi phí ADS (collection recordsMKT) -----------------------------
  // recordsMKT lưu: request1 (xin buổi sáng) + request2 (xin buổi chiều)
  //                + request3 (xin gấp)  = TỔNG ADS ĐÃ XIN  (đơn vị: VND)
  // % ADS = ADS xin / (doanh số × ADS_SALES_RATIO)
  const adsRecords = await db
    .collection("recordsMKT")
    .find(
      { date: dateStr },
      {
        projection: {
          _id: 0,
          name: 1,
          userId: 1,
          request1: 1,
          request2: 1,
          request3: 1,
        },
      },
    )
    .toArray();

  const adsByName = new Map();
  const teamAds = { DIEN: 0, PHI: 0 };
  // Số record ADS không tìm thấy nhân viên tương ứng trong `employees`
  let unmatchedAdsRecords = 0;

  for (const rec of adsRecords) {
    const ads =
      toNumber(rec.request1) + toNumber(rec.request2) + toNumber(rec.request3);
    if (ads === 0) continue;

    // Gom theo tên (cách app mkt/page.js đang dùng để tính %ADS)
    const key = norm(rec.name);
    if (key) adsByName.set(key, (adsByName.get(key) ?? 0) + ads);

    // Gán ADS vào team
    const emp = key ? empByName.get(key) : null;
    if (!emp) {
      unmatchedAdsRecords += 1;
      continue;
    }
    if (emp.position_team !== "mkt") continue;
    const teamTp = String(emp.team_tp || "").toUpperCase();
    if (!TRACKED_TEAMS.includes(teamTp)) continue;
    teamAds[teamTp] += ads;
  }

  const mktList = [...mktSales.values()]
    .map((r) => {
      const adsCost = adsByName.get(norm(r.name)) ?? 0;
      return {
        ...r,
        revenueVnd: Math.round(r.sales * EXCHANGE_RATE),
        adsCost,
        percentAds: computePercentAds(adsCost, r.sales),
      };
    })
    .sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name, "vi"));

  // Bảng xếp hạng: chỉ nhân viên MKT/Lead, và chỉ những người có phát sinh đơn
  const rankable = mktList.filter(
    (r) =>
      RANKABLE_MKT_POSITIONS.includes(String(r.position || "").toLowerCase()) &&
      r.orders > 0,
  );

  const mktRank = {};
  for (const team of TRACKED_TEAMS) {
    const inTeam = rankable.filter((r) => r.team_tp === team);
    mktRank[team] = {
      top: inTeam.slice(0, TOP_N),
      bottom: inTeam.slice(-TOP_N).reverse(),
      activeCount: inTeam.length,
    };
  }

  // ----- Tính doanh số sale (position = salenhapdon) -----------------------
  // Công thức giống sale/saleOrder: sum(profit), join bằng order.sale
  const saleSales = new Map();
  let unmatchedSaleOrders = 0;

  for (const order of orders) {
    const saleName = norm(order.sale);
    if (!saleName) continue;

    const emp = empByName.get(saleName);
    if (!emp) {
      unmatchedSaleOrders += 1;
      continue;
    }
    if (String(emp.position || "").toLowerCase() !== RANKABLE_SALE_POSITION) {
      continue;
    }

    const value = toNumber(order.profit);
    if (!saleSales.has(saleName)) {
      saleSales.set(saleName, {
        name: emp.name,
        position: emp.position,
        sales: 0,
        orders: 0,
      });
    }
    const row = saleSales.get(saleName);
    row.sales += value;
    row.orders += 1;
  }

  const saleList = [...saleSales.values()]
    .map((r) => ({ ...r, revenueVnd: Math.round(r.sales * EXCHANGE_RATE) }))
    .sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name, "vi"));

  const saleRank = {
    top: saleList.slice(0, TOP_N),
    bottom: saleList.slice(-TOP_N).reverse(),
    activeCount: saleList.length,
  };

  // ----- Gom payload -------------------------------------------------------
  const payload = {
    date: dateStr,
    dateLabel: formatVnDate(dateStr),
    generatedAt: new Date().toISOString(),
    exchangeRate: EXCHANGE_RATE,
    elapsedMs: Date.now() - dayStart,

    mktTeams: {
      DIEN: {
        team: "DIEN",
        label: TEAM_LABELS.DIEN,
        sales: teamTotals.DIEN,
        revenueVnd: Math.round(teamTotals.DIEN * EXCHANGE_RATE),
        adsCost: teamAds.DIEN,
        percentAds: computePercentAds(teamAds.DIEN, teamTotals.DIEN),
      },
      PHI: {
        team: "PHI",
        label: TEAM_LABELS.PHI,
        sales: teamTotals.PHI,
        revenueVnd: Math.round(teamTotals.PHI * EXCHANGE_RATE),
        adsCost: teamAds.PHI,
        percentAds: computePercentAds(teamAds.PHI, teamTotals.PHI),
      },
    },

    mktTop: { DIEN: mktRank.DIEN.top, PHI: mktRank.PHI.top },
    mktBottom: { DIEN: mktRank.DIEN.bottom, PHI: mktRank.PHI.bottom },
    mktRankInfo: {
      DIEN: mktRank.DIEN.activeCount,
      PHI: mktRank.PHI.activeCount,
    },
    mktList,

    saleTop: saleRank.top,
    saleBottom: saleRank.bottom,
    saleActiveCount: saleRank.activeCount,
    saleList,

    pageNewCount: pageNew[0]?.total ?? 0,
    pageNewActiveCount: pageNew[0]?.active ?? 0,
    newMessTotal: messAgg[0]?.total ?? 0,
    newMessRecords: messAgg[0]?.records ?? 0,

    // Số đơn MỚI được tạo trong ngày (theo createdAt)
    newOrdersCount: newOrdersAgg[0]?.total ?? 0,
    newOrdersBySale: newSaleCounts,

    // Số đơn ĐÃ GỬI HÀNG trong ngày (theo shippingDate1)
    shippedOrdersCount,

    meta: {
      orderCount: orders.length,
      unmatchedMktOrders,
      unmatchedSaleOrders,
      unmatchedAdsRecords,
      employeeCount: employees.length,
    },
  };

  return payload;
}

// ---------------------------------------------------------------------------
// Cache (collection dailyReports)
// ---------------------------------------------------------------------------

/**
 * Lấy payload từ cache nếu còn hiệu lực, ngược lại tính lại và ghi cache.
 * Luôn giữ nguyên `sentAt` để không mất dấu vết "đã gửi Telegram".
 */
export async function getOrBuildDailyReport(
  db,
  dateStr,
  { force = false } = {},
) {
  const col = db.collection("dailyReports");
  const existing = await col.findOne({ date: dateStr });

  const fresh =
    !force &&
    existing?.payload &&
    existing?.updatedAt &&
    Date.now() - new Date(existing.updatedAt).getTime() < CACHE_TTL_MS;

  if (fresh) {
    return {
      payload: existing.payload,
      cached: true,
      sentAt: existing.sentAt ?? null,
    };
  }

  const payload = await buildDailyReport(db, dateStr);
  const now = new Date();
  await col.updateOne(
    { date: dateStr },
    {
      $set: { date: dateStr, payload, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  return {
    payload,
    cached: false,
    sentAt: existing?.sentAt ?? null,
  };
}

/** Ghi nhận đã gửi Telegram (dùng để chống gửi trùng). */
export async function markReportSent(db, dateStr) {
  const now = new Date();
  await db.collection("dailyReports").updateOne(
    { date: dateStr },
    {
      $set: { date: dateStr, sentAt: now, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

// ---------------------------------------------------------------------------
// Định dạng tin nhắn Telegram (HTML parse_mode)
// ---------------------------------------------------------------------------
// Telegram hiển thị text thường bằng font TỈ LỆ (proportional) -> kẻ bảng bằng
// ký tự ┌─┐│ sẽ bị lệch mép. Muốn bảng thẳng hàng thì phải bọc trong <pre>
// (Telegram hiển thị <pre> bằng font MONOSPACE).
//
// Vì vậy:
//  - Phần tiêu đề/section dùng thẻ <b> (ngoài <pre>)
//  - Phần bảng dùng <pre> với cột canh thẳng bằng khoảng trắng
//  - Trong <pre> KHÔNG dùng emoji (emoji full-width làm lệch cột),
//    chỉ dùng text thuần + ký tự box-drawing (width = 1)
// ---------------------------------------------------------------------------

/** Escape ký tự đặc biệt HTML (Telegram chỉ hỗ trợ &lt; &gt; &amp;). */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Chuyển HTML về text thuần (fallback khi Telegram không parse được HTML).
 * - <pre>...</pre> giữ nguyên nội dung (bỏ thẻ)
 * - <b>...</b> bỏ thẻ
 * - Giải mã &lt; &gt; &amp;
 */
function htmlToPlainText(html) {
  return String(html ?? "")
    .replace(/<\/?pre>/gi, "")
    .replace(/<\/?b>/gi, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Độ rộng hiển thị của 1 ký tự (dùng code point, không tính emoji vì pre không chứa emoji). */
function charWidth(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 0x1100 && cp <= 0x115f) return 2; // Hangul Jamo
  if (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) return 2; // CJK
  if (cp >= 0xac00 && cp <= 0xd7a3) return 2; // Hangul
  if (cp >= 0xff00 && cp <= 0xff60) return 2; // Fullwidth
  if (cp >= 0xffe0 && cp <= 0xffe6) return 2;
  return 1;
}

/** Độ rộng hiển thị của chuỗi. */
function cellWidth(text) {
  return [...String(text ?? "")].reduce((sum, ch) => sum + charWidth(ch), 0);
}

/** Căn trái/phải 1 chuỗi trong ô có bề rộng cho trước. */
function padCell(text, width, align = "left") {
  const line = String(text ?? "");
  const gap = " ".repeat(Math.max(0, width - cellWidth(line)));
  return align === "right" ? gap + line : line + gap;
}

/**
 * Vẽ bảng dạng văn bản (monospace): hàng tiêu đề + đường kẻ phân cách.
 * Mỗi phần tử trả về là 1 dòng.
 *
 * Lưu ý: escape HTML được thực hiện SAU khi canh lề, vì `&amp;` dài hơn `&`
 * nếu escape trước sẽ làm sai độ rộng cột.
 *
 * @param {string[]} headers - tiêu đề cột
 * @param {string[][]} rows - dữ liệu (mỗi dòng là 1 mảng ô)
 * @param {("left"|"right")[]} [aligns] - căn lề từng cột
 * @returns {string[]}
 */
function renderTable(headers, rows, aligns = []) {
  const cols = headers.length;
  const body = (rows || []).map((r) =>
    Array.from({ length: cols }, (_, i) => String(r[i] ?? "")),
  );

  const widths = headers.map((h, i) =>
    Math.max(cellWidth(h), ...body.map((r) => cellWidth(r[i])), 0),
  );

  const line = (cells) =>
    cells
      .map((c, i) => escapeHtml(padCell(c, widths[i], aligns[i])))
      .join("  ");

  const out = [line(headers)];
  out.push(widths.map((w) => "─".repeat(w)).join("  "));
  body.forEach((r) => out.push(line(r)));
  return out;
}

/** Định dạng 1 giá trị tiền. */
function fmtMoneyCell(value) {
  return formatVndD(value);
}

/** Gom danh sách xếp hạng (mỗi người 1 dòng) thành các dòng của bảng. */
function rankRows(rows, teamLabel) {
  if (!rows || rows.length === 0) {
    return [[teamLabel, "-", "-", "-", "-"]];
  }
  return rows.map((r, i) => [
    teamLabel,
    `${i + 1}. ${r.name}`,
    fmtMoneyCell(r.revenueVnd),
    fmtMoneyCell(r.adsCost ?? 0),
    fmtPercentCell(r.percentAds ?? 0, r.adsCost ?? 0),
  ]);
}

/** Định dạng phần trăm (2 chữ số thập phân).
 *  Nếu có chi phí ADS nhưng doanh số = 0 thì không tính được % -> hiển thị "-". */
function fmtPercentCell(value, adsCost) {
  const n = toNumber(value);
  if (n <= 0 && toNumber(adsCost) > 0) return "-";
  return `${n.toFixed(2)}%`;
}

/**
 * Các dòng chỉ số hoạt động trong ngày (dùng chung cho bảng HTML và rich message).
 *
 * @param {object} payload
 * @returns {string[][]} mỗi phần tử là 1 dòng [nhãn, giá trị]
 */
function activityRows(payload) {
  const newOrders = payload.newOrdersCount ?? 0;
  const newMess = payload.newMessTotal ?? 0;

  // Tỉ lệ chốt = đơn mới / tổng mess mới (bỏ qua khi không có mess)
  const closeRate =
    newMess > 0 ? `${((newOrders / newMess) * 100).toFixed(2)}%` : "-";

  return [
    ["Page mới hôm nay", String(payload.pageNewCount ?? 0)],
    ["Đơn mới hôm nay", String(newOrders)],
    ["Tổng mess mới", String(newMess)],
    ["Tỉ lệ chốt", closeRate],
    ["Đơn đã gửi hàng hôm nay", String(payload.shippedOrdersCount ?? 0)],
  ];
}

/**
 * Tạo nội dung tin nhắn Telegram (HTML) từ payload.
 *
 * @param {object} payload - dữ liệu báo cáo
 * @param {"noon"|"end"} [slot] - "noon" = báo cáo trưa 12h,
 *        "end" = báo cáo tổng kết cuối ngày 21h.
 * @returns {string} nội dung HTML (dùng parse_mode: HTML)
 */
export function formatTelegramMessage(payload, { slot } = {}) {
  const parts = [];

  if (slot === "noon") {
    parts.push(`<b>🌤️ BÁO CÁO TRƯA · ${escapeHtml(payload.dateLabel)}</b>`);
  } else if (slot === "end") {
    parts.push(`<b>🌙 BÁO CÁO TỔNG KẾT · ${escapeHtml(payload.dateLabel)}</b>`);
  } else {
    parts.push(`<b>📊 BÁO CÁO NGÀY · ${escapeHtml(payload.dateLabel)}</b>`);
  }

  // ----- 1. Tổng doanh số MKT theo team ---------------------------------
  parts.push("");
  parts.push("<b>💰 DOANH SỐ MKT</b>");
  parts.push(
    "<pre>" +
      renderTable(
        ["TEAM", "DOANH SỐ", "CHI PHÍ ADS", "% ADS"],
        TRACKED_TEAMS.map((team) => [
          payload.mktTeams[team].label,
          fmtMoneyCell(payload.mktTeams[team].revenueVnd),
          fmtMoneyCell(payload.mktTeams[team].adsCost ?? 0),
          fmtPercentCell(
            payload.mktTeams[team].percentAds ?? 0,
            payload.mktTeams[team].adsCost ?? 0,
          ),
        ]),
        ["left", "right", "right", "right"],
      ).join("\n") +
      "</pre>",
  );

  // ----- 2. Bảng xếp hạng MKT (cao nhất) -------------------------------
  const topRows = TRACKED_TEAMS.flatMap((team) =>
    rankRows(payload.mktTop[team], payload.mktTeams[team].label),
  );
  parts.push("");
  parts.push("<b>🏆 MKT CAO NHẤT</b>");
  parts.push(
    "<pre>" +
      renderTable(
        ["TEAM", "MKT", "DOANH SỐ", "CHI PHÍ ADS", "% ADS"],
        topRows,
        ["left", "left", "right", "right", "right"],
      ).join("\n") +
      "</pre>",
  );

  // ----- 3. Bảng xếp hạng MKT (thấp nhất) ------------------------------
  const bottomRows = TRACKED_TEAMS.flatMap((team) =>
    rankRows(payload.mktBottom[team], payload.mktTeams[team].label),
  );
  parts.push("");
  parts.push("<b>🔻 MKT THẤP NHẤT</b>");
  parts.push(
    "<pre>" +
      renderTable(
        ["TEAM", "MKT", "DOANH SỐ", "CHI PHÍ ADS", "% ADS"],
        bottomRows,
        ["left", "left", "right", "right", "right"],
      ).join("\n") +
      "</pre>",
  );

  // ----- 4. Chỉ số hoạt động trong ngày --------------------------------
  parts.push("");
  parts.push("<b>📈 HOẠT ĐỘNG TRONG NGÀY</b>");
  parts.push(
    "<pre>" +
      renderTable(["CHỈ SỐ", "GIÁ TRỊ"], activityRows(payload), [
        "left",
        "right",
      ]).join("\n") +
      "</pre>",
  );

  // ----- 5. Sale nhập đơn -----------------------------------------------
  parts.push("");
  parts.push("<b>🛒 SALE NHẬP ĐƠN</b>");
  parts.push(
    "<pre>" +
      renderTable(
        ["HẠNG", "SALE", "DOANH SỐ"],
        [
          [
            "Cao nhất",
            payload.saleTop[0]?.name ?? "-",
            fmtMoneyCell(payload.saleTop[0]?.revenueVnd ?? 0),
          ],
          [
            "Thấp nhất",
            payload.saleBottom[0]?.name ?? "-",
            fmtMoneyCell(payload.saleBottom[0]?.revenueVnd ?? 0),
          ],
        ],
        ["left", "left", "right"],
      ).join("\n") +
      "</pre>",
  );

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Rich message (Bot API 10.1+) — bảng native nền sáng theo theme Telegram
// ---------------------------------------------------------------------------
// Telegram hiển thị <pre> với nền TỐI (code block), nên bảng trông bị "tối".
// Bot API 10.1 (6/2026) bổ sung `sendRichMessage` với khối bảng native
// (InputRichBlockTable): nền sáng, viền, sọc theo theme của client.
//
// Chiến lược:
//   1. Thử `sendRichMessage` trước (bảng đẹp, nền sáng)
//   2. Nếu API lỗi (bot cũ / server chưa hỗ trợ) -> tự động fallback
//      sang `sendMessage` + parse_mode HTML (bảng <pre> nền tối như cũ)

/** Tạo 1 ô bảng (RichBlockTableCell). */
function richCell(text, { isHeader = false, align = "left" } = {}) {
  const cell = { text: String(text ?? "") };
  if (isHeader) cell.is_header = true;
  if (align) cell.align = align;
  return cell;
}

/**
 * Tạo 1 khối bảng native.
 *
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {("left"|"right")[]} aligns
 * @param {string} [caption]
 */
function richTable(headers, rows, aligns = [], caption) {
  const cells = [];
  cells.push(
    headers.map((h) => richCell(h, { isHeader: true, align: "left" })),
  );
  for (const row of rows) {
    cells.push(
      row.map((v, i) =>
        richCell(v, { align: aligns[i] === "right" ? "right" : "left" }),
      ),
    );
  }
  const block = {
    type: "table",
    cells,
    is_bordered: true,
    is_striped: true,
    is_compact: true,
  };
  if (caption) block.caption = caption;
  return block;
}

/** Tạo 1 khối tiêu đề nhỏ. */
function richHeading(text) {
  return { type: "heading", text: String(text ?? ""), size: 4 };
}

/** Tạo 1 khối đoạn văn. */
function richParagraph(text) {
  return { type: "paragraph", text: String(text ?? "") };
}

/**
 * Dựng nội dung rich message (Bot API 10.1+) từ payload.
 *
 * @param {object} payload
 * @param {"noon"|"end"} [slot]
 * @returns {{ blocks: object[] }} đối tượng `rich_message` gửi cho Telegram
 */
export function buildTelegramRichMessage(payload, { slot } = {}) {
  const blocks = [];

  if (slot === "noon") {
    blocks.push(richHeading(`🌤️ BÁO CÁO TRƯA · ${payload.dateLabel}`));
  } else if (slot === "end") {
    blocks.push(richHeading(`🌙 BÁO CÁO TỔNG KẾT · ${payload.dateLabel}`));
  } else {
    blocks.push(richHeading(`📊 BÁO CÁO NGÀY · ${payload.dateLabel}`));
  }

  // ----- 1. Tổng doanh số MKT theo team ---------------------------------
  blocks.push(
    richTable(
      ["TEAM", "DOANH SỐ", "CHI PHÍ ADS", "% ADS"],
      TRACKED_TEAMS.map((team) => [
        payload.mktTeams[team].label,
        fmtMoneyCell(payload.mktTeams[team].revenueVnd),
        fmtMoneyCell(payload.mktTeams[team].adsCost ?? 0),
        fmtPercentCell(
          payload.mktTeams[team].percentAds ?? 0,
          payload.mktTeams[team].adsCost ?? 0,
        ),
      ]),
      ["left", "right", "right", "right"],
      "💰 DOANH SỐ MKT",
    ),
  );

  // ----- 2. Bảng xếp hạng MKT (cao nhất) -------------------------------
  blocks.push(
    richTable(
      ["TEAM", "MKT", "DOANH SỐ", "CHI PHÍ ADS", "% ADS"],
      TRACKED_TEAMS.flatMap((team) =>
        rankRows(payload.mktTop[team], payload.mktTeams[team].label),
      ),
      ["left", "left", "right", "right", "right"],
      "🏆 MKT CAO NHẤT",
    ),
  );

  // ----- 3. Bảng xếp hạng MKT (thấp nhất) ------------------------------
  blocks.push(
    richTable(
      ["TEAM", "MKT", "DOANH SỐ", "CHI PHÍ ADS", "% ADS"],
      TRACKED_TEAMS.flatMap((team) =>
        rankRows(payload.mktBottom[team], payload.mktTeams[team].label),
      ),
      ["left", "left", "right", "right", "right"],
      "🔻 MKT THẤP NHẤT",
    ),
  );

  // ----- 4. Chỉ số hoạt động trong ngày --------------------------------
  blocks.push(
    richTable(
      ["CHỈ SỐ", "GIÁ TRỊ"],
      activityRows(payload),
      ["left", "right"],
      "📈 HOẠT ĐỘNG TRONG NGÀY",
    ),
  );

  // ----- 5. Sale nhập đơn -----------------------------------------------
  blocks.push(
    richTable(
      ["HẠNG", "SALE", "DOANH SỐ"],
      [
        [
          "Cao nhất",
          payload.saleTop[0]?.name ?? "-",
          fmtMoneyCell(payload.saleTop[0]?.revenueVnd ?? 0),
        ],
        [
          "Thấp nhất",
          payload.saleBottom[0]?.name ?? "-",
          fmtMoneyCell(payload.saleBottom[0]?.revenueVnd ?? 0),
        ],
      ],
      ["left", "left", "right"],
      "🛒 SALE NHẬP ĐƠN",
    ),
  );

  return { blocks };
}

// ---------------------------------------------------------------------------
// Gửi Telegram
// ---------------------------------------------------------------------------

/**
 * Parse TELEGRAM_CHAT_ID thành danh sách chat id.
 * Hỗ trợ nhiều id ngăn cách bằng dấu phẩy, khoảng trắng hoặc dấu chấm phẩy.
 * Ví dụ: "1696923084,6280099511" -> ["1696923084", "6280099511"]
 */
export function parseChatIds(raw) {
  return String(raw ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Gửi 1 tin nhắn Telegram qua Bot API tới NHIỀU chat id.
 * Dùng fetch native (Node 18+ / Next runtime) -> không cần thêm package.
 *
 * Chiến lược gửi (mỗi chat):
 *   1. `sendRichMessage` với bảng native -> BẢNG NỀN SÁNG (Bot API 10.1+)
 *   2. Nếu API chưa hỗ trợ -> `sendMessage` + parse_mode HTML (bảng <pre>)
 *   3. Nếu HTML lỗi -> `sendMessage` dạng text thuần (bỏ thẻ)
 *
 * - Nếu 1 chat lỗi (bot chưa được add vào group, id sai...) thì các chat
 *   còn lại vẫn được gửi; lỗi được gom lại và trả về trong `errors`.
 * - Nếu TẤT CẢ đều lỗi thì mới throw.
 *
 * @param {string} text - nội dung HTML (fallback)
 * @param {object} [opts]
 * @param {object} [opts.richMessage] - đối tượng `rich_message` (InputRichMessage)
 */
export async function sendTelegramMessage(
  text,
  { token, chatId, richMessage } = {},
) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  const chatIdValue = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    throw new Error("Thiếu TELEGRAM_BOT_TOKEN trong .env.local");
  }

  const chatIds = parseChatIds(chatIdValue);
  // Thêm chat ID của nhóm Telegram (nếu cấu hình) -> gửi tới cả nhóm.
  const groupIds = parseChatIds(process.env.TELEGRAM_GROUP_CHAT_ID);
  for (const g of groupIds) {
    if (!chatIds.includes(g)) chatIds.push(g);
  }

  if (chatIds.length === 0) {
    throw new Error("Thiếu TELEGRAM_CHAT_ID trong .env.local");
  }

  const results = [];
  const errors = [];

  // Bản fallback dạng text thuần (bỏ thẻ HTML) để dùng khi HTML lỗi.
  const plainFallback = htmlToPlainText(text);

  /** Lỗi này có nghĩa là server/bot chưa hỗ trợ rich message -> dùng sendMessage. */
  const isRichUnsupported = (msg) =>
    /not found|method not found|404|unknown method|invalid rich|rich_message|rich message|Bad Request: can't use/i.test(
      msg,
    );

  /** Lỗi do parse HTML -> gửi lại dạng text thuần. */
  const isHtmlParseError = (msg) =>
    /can't parse entities|unsupported start tag|parse entities|can't find end tag/i.test(
      msg,
    );

  for (const id of chatIds) {
    let sent = false;
    let firstError = null;
    // Biến đánh dấu đã thử rich message (để không thử lại vô ích)
    let richTried = false;

    // ----- Bước 1: thử rich message (bảng nền sáng) ----------------------
    if (richMessage) {
      richTried = true;
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendRichMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: id,
              rich_message: richMessage,
              disable_web_page_preview: true,
            }),
          },
        );

        const body = await res.json().catch(() => null);
        if (!res.ok || body?.ok === false) {
          throw new Error(
            `HTTP ${res.status}: ${body?.description || "unknown"}`,
          );
        }
        results.push({ chatId: id, ok: true, mode: "rich" });
        sent = true;
      } catch (err) {
        const msg = err?.message || String(err);
        if (!firstError) firstError = msg;
        if (isRichUnsupported(msg)) {
          console.warn(
            `[dailyReport] Rich message không được hỗ trợ, dùng sendMessage cho ${id}:`,
            msg,
          );
        } else {
          console.error(
            `[dailyReport] Gửi rich message tới ${id} thất bại:`,
            msg,
          );
          // Lỗi khác (không phải "chưa hỗ trợ") -> vẫn thử fallback text
        }
      }
    }

    if (sent) continue;

    // ----- Bước 2 & 3: sendMessage (HTML -> text thuần) -------------------
    for (const payloadText of [text, plainFallback]) {
      const isFallback = payloadText !== text;
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: id,
              text: payloadText,
              parse_mode: isFallback ? undefined : "HTML",
              disable_web_page_preview: true,
            }),
          },
        );

        const body = await res.json().catch(() => null);
        if (!res.ok || body?.ok === false) {
          throw new Error(
            `HTTP ${res.status}: ${body?.description || "unknown"}`,
          );
        }
        results.push({
          chatId: id,
          ok: true,
          mode: isFallback ? "plain" : "html",
        });
        sent = true;
        break;
      } catch (err) {
        const msg = err?.message || String(err);
        if (!firstError) firstError = msg;
        if (!isFallback && isHtmlParseError(msg)) {
          console.error(
            `[dailyReport] HTML lỗi, gửi lại dạng text thuần tới ${id}:`,
            msg,
          );
          continue;
        }
        console.error(`[dailyReport] Gửi Telegram tới ${id} thất bại:`, msg);
      }
    }

    if (!sent) {
      errors.push({
        chatId: id,
        error: firstError || "Không gửi được",
        richTried,
      });
    }
  }

  // Chỉ throw khi KHÔNG chat nào gửi được
  if (results.length === 0) {
    const detail = errors.map((e) => `${e.chatId}: ${e.error}`).join(" | ");
    throw new Error(`Gửi Telegram thất bại cho tất cả chat ID -> ${detail}`);
  }

  return {
    ok: true,
    sent: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Hàm tiện ích tổng hợp (dùng bởi API route)
// ---------------------------------------------------------------------------

/** Mở kết nối DB + đảm bảo index, rồi chạy callback. */
export async function withReportDb(fn) {
  const { db } = await connectToDatabase();
  await ensureReportIndexes(db);
  return fn(db);
}

/**
 * Chuỗi bảo vệ cho endpoint gửi Telegram.
 * - Ưu tiên header `x-report-secret`
 * - Sau đó tới query `?secret=`
 */
export function checkReportSecret(request) {
  // Danh sách secret được chấp nhận.
  //   REPORT_SECRET -> secret riêng do bạn tự đặt (dùng cho Task Scheduler / gọi tay)
  //   CRON_SECRET  -> secret Vercel tự sinh, gửi kèm header "Authorization: Bearer"
  // Chấp nhận nếu khớp BẤT KỲ giá trị nào -> tránh xung đột khi 2 biến khác nhau.
  const accepted = [process.env.REPORT_SECRET, process.env.CRON_SECRET]
    .map((v) => (v || "").trim())
    .filter(Boolean);

  // 1) Header "x-report-secret" (dùng tay / Task Scheduler)
  let provided = request.headers.get("x-report-secret");

  // 2) Header "Authorization: Bearer <token>" -> Vercel Cron gửi CRON_SECRET
  //    theo đúng định dạng này.
  if (!provided) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && /^bearer\s+/i.test(authHeader)) {
      provided = authHeader.replace(/^bearer\s+/i, "").trim();
    }
  }

  // 3) Query ?secret=
  if (!provided) {
    provided = new URL(request.url).searchParams.get("secret");
  }

  provided = (provided || "").trim();

  if (provided) {
    return {
      ok: accepted.length === 0 ? true : accepted.includes(provided),
      configured: accepted.length > 0,
    };
  }

  // Request do chính Vercel Cron kích hoạt (user-agent "vercel-cron/1.0").
  // -> Tin cậy, không cần secret (trường hợp bạn KHÔNG set CRON_SECRET).
  const ua = request.headers.get("user-agent") || "";
  if (ua.includes("vercel-cron")) {
    return { ok: true, configured: accepted.length > 0, via: "vercel-cron" };
  }

  // Không truyền secret:
  //  - Chưa cấu hình secret -> cho qua (chế độ dev)
  //  - Request từ chính trang web (nút "Gửi Telegram") -> cho qua.
  //    Browser gửi header "sec-fetch-site: same-origin" cho fetch cùng origin.
  if (accepted.length === 0) {
    return { ok: true, configured: false };
  }

  const sameOrigin =
    request.headers.get("sec-fetch-site") === "same-origin" ||
    request.headers.get("sec-fetch-site") === "none";
  if (sameOrigin) {
    return { ok: true, configured: true, via: "same-origin" };
  }

  return { ok: false, configured: true };
}
