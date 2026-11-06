// ============================================================================
// BÁO CÁO CARE CAMP — CHỈ ĐỌC CHO ADMIN
// ----------------------------------------------------------------------------
// Admin KHÔNG cần thiết lập tên nhân viên / token / tài khoản.
// Hàm này chỉ ĐỌC dữ liệu mà nhân viên đã lưu trong khi dùng web.
//
// GET /api/care-camp/reports
//   ?date=YYYY-MM-DD     ngày cần xem (mặc định hôm nay giờ VN)
//   ?name=Nguyễn Văn A  lọc theo 1 nhân viên
//   ?all=1               xem tất cả các ngày (không lọc theo ngày)
//   ?dates=1             trả về danh sách các ngày có báo cáo
//   ?employees=1         trả về danh sách nhân viên đã từng dùng Care Camp
//
// Ví dụ:
//   /api/care-camp/reports
//   /api/care-camp/reports?date=2026-10-31
//   /api/care-camp/reports?name=Nguyễn%20Quốc%20Hiếu&all=1
// ============================================================================

import {
  listReportDates,
  listSavedReports,
  listTrackedEmployees,
  withCareCampDb,
} from "../../../lib/careCamp.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const dateParam = params.get("date");
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam || "") ? dateParam : null;
    const name = (params.get("name") || "").trim();
    const wantAll = params.get("all") === "1";
    const wantDates = params.get("dates") === "1";
    const wantEmployees = params.get("employees") === "1";

    const out = await withCareCampDb(async (db) => {
      const result = {};

      if (wantDates) {
        result.dates = await listReportDates(db);
        return result;
      }

      if (wantEmployees) {
        result.employees = await listTrackedEmployees(db);
        return result;
      }

      if (name && !date && !wantAll) {
        // Không có ngày -> lấy ngày mới nhất của nhân viên này
        const rows = await listSavedReports(db, { employeeName: name, limit: 1 });
        result.reports = rows;
        result.report = rows[0]?.payload || null;
        result.date = rows[0]?.date || null;
        return result;
      }

      const query = {};
      if (!wantAll && date) query.date = date;
      if (name) query.employeeName = name;

      result.reports = await listSavedReports(db, {
        ...query,
        limit: 300,
      });
      result.date = date;
      result.employeeName = name || null;

      return result;
    });

    return Response.json(out);
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/reports:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
