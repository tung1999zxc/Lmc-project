// ============================================================================
// LÕI BÁO CÁO TỔNG QUAN CÁ NHÂN CHO NHÂN VIÊN MKT
// ----------------------------------------------------------------------------
// Module thuần ESM, KHÔNG phụ thuộc Next.js -> dùng được từ API route.
//
// Công thức doanh số (GIỐNG HỆT trang src/app/mkt/page.js):
//   doanhShoVnd = sum(profitmkt ?? profit) * EXCHANGE_RATE * ADS_SALES_RATIO
//   (0.95 là hệ số "tiền thu" mà app đang dùng khi hiển thị doanh số MKT)
//
// Công thức % ADS (GIỐNG HỆT bảng "Báo cáo MKT" src/app/mkt/page.js):
//   percentAds = adsCost / (doanhShoVnd đã hiển thị) * 100
//   trong đó doanhShoVnd đã hiển thị = sum(profitmkt) * EXCHANGE_RATE * 0.95
//   (KHÔNG chia thêm 0.95 lần nữa ở mẫu số)
//
// Chi phí ADS = request1 + request2 + request3 trong collection `recordsMKT`.
// ============================================================================

import { connectToDatabase } from "../mongodb.mjs";

/** Tỷ giá quy đổi KRW -> VND */
export const EXCHANGE_RATE = 17000;

/** Hệ số doanh số MKT (tiền thu) */
export const ADS_SALES_RATIO = 0.95;

/** Các mốc doanh số (VND) dùng để theo dõi tiến độ */
export const MILESTONES = [
  { value: 100_000_000, label: "100 triệu", color: "#52c41a" },
  { value: 130_000_000, label: "130 triệu", color: "#13c2c2" },
  { value: 180_000_000, label: "180 triệu", color: "#1677ff" },
  { value: 250_000_000, label: "250 triệu", color: "#722ed1" },
  { value: 350_000_000, label: "350 triệu", color: "#fa8c16" },
];

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Chuỗi ngày "YYYY-MM-DD" theo giờ Việt Nam (UTC+7, không DST) */
const VN_OFFSET_MIN = 420;

export function getVnDateStr(date = new Date()) {
  const shifted = new Date(date.getTime() + VN_OFFSET_MIN * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** Ngày đầu / cuối của tháng theo giờ VN (chuỗi "YYYY-MM-DD") */
export function getMonthRange(dateStr) {
  const [y, m] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

/** Khoảng N ngày gần nhất (bao gồm hôm nay), theo giờ VN */
export function getLastNDaysRange(dateStr, days = 7) {
  const end = dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const startDate = new Date(Date.UTC(y, m - 1, d - (days - 1)));
  return { start: startDate.toISOString().slice(0, 10), end };
}

/**
 * Chuẩn hóa period -> { start, end, label }
 * @param {string} period - "today" | "month" | "lastMonth" | "7days" | "30days"
 * @param {string} dateStr - ngày tham chiếu "YYYY-MM-DD" (giờ VN)
 */
export function resolvePeriod(period, dateStr) {
  switch (period) {
    case "today":
      return { start: dateStr, end: dateStr, label: "Hôm nay" };
    case "lastMonth": {
      const [y, m] = dateStr.split("-").map(Number);
      const prev = getMonthRange(
        new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10),
      );
      return { ...prev, label: "Tháng trước" };
    }
    case "7days":
      return { ...getLastNDaysRange(dateStr, 7), label: "7 ngày gần nhất" };
    case "30days":
      return { ...getLastNDaysRange(dateStr, 30), label: "30 ngày gần nhất" };
    case "month":
    default: {
      const { start, end } = getMonthRange(dateStr);
      const [y, m] = dateStr.split("-").map(Number);
      return {
        start,
        end,
        label: `Tháng ${String(m).padStart(2, "0")}/${y}`,
      };
    }
  }
}

/**
 * Tính % ADS.
 *
 * CÔNG THỨC GIỐNG HỆT bảng "Báo cáo MKT" (src/app/mkt/page.js):
 *   % ADS = ADS xin / (doanh số đã hiển thị) * 100
 *   trong đó doanh số đã hiển thị = sum(profitmkt) * 17000 * 0.95
 *
 * LƯU Ý: `revenueVnd` đã bao gồm sẵn hệ số 0.95 nên KHÔNG chia thêm lần nữa.
 *
 * @param {number} adsCost - tổng ADS đã xin (VND)
 * @param {number} revenueVnd - doanh số đã hiển thị (đã × 17000 × 0.95)
 */
export function computePercentAds(adsCost, revenueVnd) {
  const base = toNumber(revenueVnd);
  if (base <= 0) return 0;
  return (toNumber(adsCost) / base) * 100;
}

/** Tìm mốc cao nhất đã đạt */
export function getHighestReachedMilestone(revenueVnd) {
  let best = null;
  for (const m of MILESTONES) {
    if (toNumber(revenueVnd) >= m.value) best = m;
  }
  return best;
}

/** Danh sách mốc kèm tiến độ */
export function buildMilestones(revenueVnd) {
  const rev = toNumber(revenueVnd);
  return MILESTONES.map((m) => {
    const percent = rev > 0 ? Math.min(100, (rev / m.value) * 100) : 0;
    return {
      ...m,
      percent: Number(percent.toFixed(2)),
      reached: rev >= m.value,
      remaining: Math.max(0, m.value - rev),
    };
  });
}

// ---------------------------------------------------------------------------
// Lõi tính toán
// ---------------------------------------------------------------------------

/**
 * Tính toàn bộ số liệu tổng quan cá nhân cho 1 nhân viên MKT.
 *
 * @param {import('mongodb').Db} db
 * @param {object} options
 * @param {string} options.employeeName - tên nhân viên (dùng để match đơn & ADS)
 * @param {number} [options.employeeCode] - mã nhân viên (match ADS theo userId)
 * @param {string} options.start - "YYYY-MM-DD"
 * @param {string} options.end   - "YYYY-MM-DD"
 * @param {string} [options.periodLabel]
 * @param {boolean} [options.includeDaily] - có lấy chi tiết theo ngày hay không
 * @param {string} [options.todayStr] - "YYYY-MM-DD" ngày chặn (mặc định hôm nay giờ VN).
 *   Các ngày vượt quá ngày này được coi là "ngày chưa tới" và bị loại khỏi `daily`.
 */
export async function buildMktOverview(db, options) {
  const {
    employeeName,
    employeeCode = null,
    start,
    end,
    periodLabel = "",
    includeDaily = true,
    todayStr = getVnDateStr(),
  } = options;

  const nameKey = norm(employeeName);

  // ----- 1. Thông tin nhân viên ------------------------------------------
  const employee = await db
    .collection("employees")
    .findOne(
      { $or: [{ name: employeeName }, { name: { $regex: `^${escapeRegExp(employeeName)}$`, $options: "i" } }] },
      { projection: { name: 1, position: 1, position_team: 1, team_tp: 1, team_id: 1, employee_code: 1, username: 1 } },
    );

  const code = employeeCode ?? employee?.employee_code ?? null;
  const codeNum = code === null ? null : Number(code);

  // ----- 2. Đơn hàng trong khoảng thời gian ------------------------------
  const orders = await db
    .collection("orders")
    .find(
      { orderDate: { $gte: start, $lte: end } },
      {
        projection: {
          _id: 0,
          orderDate: 1,
          mkt: 1,
          sale: 1,
          profit: 1,
          profitmkt: 1,
          revenue: 1,
          saleReport: 1,
        },
      },
    )
    .toArray();

  let ordersCount = 0;
  let ordersDoneCount = 0; // số đơn saleReport === "DONE"
  let rawSales = 0; // tổng profitmkt (chưa quy đổi)
  let revenueTotal = 0; // tổng revenue (giá trị đơn, chưa quy đổi)
  const dailyMap = new Map();

  for (const order of orders) {
    if (norm(order.mkt) !== nameKey) continue;

    const value = toNumber(order.profitmkt ?? order.profit);
    rawSales += value;
    ordersCount += 1;
    revenueTotal += toNumber(order.revenue);

    const isDone = String(order.saleReport ?? "").trim().toUpperCase() === "DONE";

    const day = String(order.orderDate || "").slice(0, 10);
    if (!day) continue;
    if (!dailyMap.has(day)) {
      dailyMap.set(day, { date: day, sales: 0, orders: 0, doneOrders: 0 });
    }
    const row = dailyMap.get(day);
    row.sales += value;
    row.orders += 1;
    if (isDone) {
      row.doneOrders += 1;
      ordersDoneCount += 1;
    }
  }

  // Số đơn "check" = TỔNG ĐƠN - số đơn DONE
  const ordersCheckCount = ordersCount - ordersDoneCount;

  // Doanh số hiển thị (đã × tỷ giá × 0.95)
  const revenueVnd = Math.round(rawSales * EXCHANGE_RATE * ADS_SALES_RATIO);
  const grossRevenueVnd = Math.round(rawSales * EXCHANGE_RATE);

  // ----- 3. Chi phí ADS (recordsMKT) ---------------------------------------
  const adsRecords = await db
    .collection("recordsMKT")
    .find(
      { date: { $gte: start, $lte: end } },
      {
        projection: {
          _id: 0,
          name: 1,
          userId: 1,
          date: 1,
          request1: 1,
          request2: 1,
          request3: 1,
        },
      },
    )
    .toArray();

  let adsCost = 0;
  const adsDailyMap = new Map();
  for (const rec of adsRecords) {
    const matchByName = norm(rec.name) === nameKey;
    const matchByCode =
      codeNum !== null && Number(rec.userId) === codeNum && Number.isFinite(Number(rec.userId));
    if (!matchByName && !matchByCode) continue;

    const ads =
      toNumber(rec.request1) + toNumber(rec.request2) + toNumber(rec.request3);
    if (ads <= 0) continue;

    adsCost += ads;

    const day = String(rec.date || "").slice(0, 10);
    if (!day) continue;
    adsDailyMap.set(day, (adsDailyMap.get(day) ?? 0) + ads);
  }

  const percentAds = computePercentAds(adsCost, revenueVnd);

  // ----- 4. Chi tiết theo ngày ---------------------------------------------
  let daily = [];
  if (includeDaily) {
    const days = [];
    const [sy, sm, sd] = start.split("-").map(Number);
    const cursor = new Date(Date.UTC(sy, sm - 1, sd));
    const [ey, em, ed] = end.split("-").map(Number);
    const last = new Date(Date.UTC(ey, em - 1, ed));
    // Chặn trên = ngày tham chiếu (mặc định hôm nay theo giờ VN).
    // Các ngày vượt quá ngày này là "ngày chưa tới" -> không hiển thị.
    const cutoff = todayStr;
    while (cursor <= last) {
      const day = cursor.toISOString().slice(0, 10);
      if (day > cutoff) break;
      days.push(day);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      if (days.length > 400) break;
    }

    daily = days.map((day) => {
      const row = dailyMap.get(day);
      const raw = row ? row.sales : 0;
      const dayVnd = Math.round(raw * EXCHANGE_RATE * ADS_SALES_RATIO);
      const dayAds = adsDailyMap.get(day) ?? 0;
      const dayOrders = row ? row.orders : 0;
      const dayDone = row ? row.doneOrders : 0;
      return {
        date: day,
        revenueVnd: dayVnd,
        orders: dayOrders,
        doneOrders: dayDone,
        checkOrders: dayOrders - dayDone,
        adsCost: dayAds,
        percentAds: computePercentAds(dayAds, dayVnd),
        // Chi phí ADS trên mỗi đơn
        costPerOrder: dayOrders > 0 ? Math.round(dayAds / dayOrders) : 0,
      };
    });
  }

  // ----- 5. Mốc doanh số ----------------------------------------------------
  const milestones = buildMilestones(revenueVnd);
  const reached = milestones.filter((m) => m.reached);
  const highestReached = reached.length ? reached[reached.length - 1] : null;
  const nextMilestone = milestones.find((m) => !m.reached) || null;

  return {
    employee: {
      name: employee?.name ?? employeeName,
      position: employee?.position ?? "mkt",
      position_team: employee?.position_team ?? "mkt",
      team_tp: employee?.team_tp ?? null,
      employee_code: codeNum,
    },
    period: { start, end, label: periodLabel },
    revenueVnd,
    grossRevenueVnd,
    // Tổng giá trị đơn (revenue) trong kỳ, đã quy đổi VND
    orderValueVnd: Math.round(revenueTotal * EXCHANGE_RATE),
    ordersCount,
    // Số đơn đã DONE (saleReport === "DONE")
    ordersDoneCount,
    // Số đơn check = TỔNG ĐƠN - số đơn DONE
    ordersCheckCount,
    adsCost,
    percentAds,
    // Chi phí ADS trên mỗi đơn (ADS / tổng đơn)
    costPerOrder: ordersCount > 0 ? Math.round(adsCost / ordersCount) : 0,
    // Lợi nhuận gộp sau khi trừ ADS
    profitAfterAds: revenueVnd - adsCost,
    milestones,
    highestReached: highestReached
      ? { value: highestReached.value, label: highestReached.label }
      : null,
    nextMilestone: nextMilestone
      ? {
          value: nextMilestone.value,
          label: nextMilestone.label,
          remaining: nextMilestone.remaining,
          percent: nextMilestone.percent,
        }
      : null,
    daily,
  };
}

/** Escape regex cho tên nhân viên (tên có thể chứa ký tự đặc biệt). */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tính cùng chỉ số cho khoảng trước để so sánh tăng trưởng.
 */
export async function buildPreviousPeriodSummary(db, options) {
  const { start, end } = options;
  const curStart = new Date(`${start}T00:00:00.000Z`);
  const curEnd = new Date(`${end}T00:00:00.000Z`);
  const spanMs = curEnd.getTime() - curStart.getTime() + 24 * 60 * 60 * 1000;
  const prevEnd = new Date(curStart.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - spanMs + 24 * 60 * 60 * 1000);

  const prev = await buildMktOverview(db, {
    ...options,
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
    includeDaily: false,
  });

  return prev;
}

/** Mở kết nối DB rồi chạy callback. */
export async function withOverviewDb(fn) {
  const { db } = await connectToDatabase();
  return fn(db);
}
