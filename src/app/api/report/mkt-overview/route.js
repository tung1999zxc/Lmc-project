// ============================================================================
// API TỔNG QUAN CÁ NHÂN CHO NHÂN VIÊN MKT
// ----------------------------------------------------------------------------
// GET /api/report/mkt-overview
//   ?name=Nguyễn Văn A   tên nhân viên (bắt buộc)
//   ?employeeCode=123    mã nhân viên (khuyến nghị, giúp match ADS chính xác)
//   ?period=today       today | month | lastMonth | 7days | 30days
//   ?date=YYYY-MM-DD    ngày tham chiếu (giờ VN), mặc định hôm nay
//   ?includeDaily=0     bỏ qua chi tiết theo ngày
//
// Trả về: doanh số, số đơn, chi phí ADS, % ADS, tiến độ các mốc doanh số.
// ============================================================================

import {
  buildMktOverview,
  buildPreviousPeriodSummary,
  getVnDateStr,
  resolvePeriod,
  withOverviewDb,
} from "../../../lib/report/mktOverview.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PERIODS = ["today", "month", "lastMonth", "7days", "30days"];

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const name = (url.searchParams.get("name") || "").trim();
    const employeeCodeRaw = url.searchParams.get("employeeCode");
    const periodParam = url.searchParams.get("period") || "month";
    const dateParam = url.searchParams.get("date");
    const includeDaily = url.searchParams.get("includeDaily") !== "0";

    if (!name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Thiếu tham số name (tên nhân viên)" }),
        { status: 400 },
      );
    }

    const period = PERIODS.includes(periodParam) ? periodParam : "month";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam || "")
      ? dateParam
      : getVnDateStr();

    const range = resolvePeriod(period, date);
    const employeeCode = employeeCodeRaw ? Number(employeeCodeRaw) : null;

    const result = await withOverviewDb(async (db) => {
      const current = await buildMktOverview(db, {
        employeeName: name,
        employeeCode: Number.isFinite(employeeCode) ? employeeCode : null,
        start: range.start,
        end: range.end,
        periodLabel: range.label,
        includeDaily,
        todayStr: date,
      });

      const previous = await buildPreviousPeriodSummary(db, {
        employeeName: name,
        employeeCode: Number.isFinite(employeeCode) ? employeeCode : null,
        start: range.start,
        end: range.end,
        periodLabel: range.label,
      });

      return { current, previous };
    });

    return new Response(
      JSON.stringify({
        ok: true,
        period,
        date,
        data: result.current,
        previous: result.previous,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi GET /api/report/mkt-overview:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Lỗi server nội bộ",
        detail: error?.message,
      }),
      { status: 500 },
    );
  }
}
