// ============================================================================
// KIỂM TRA & TỰ ĐỘNG TẮT CHIẾN DỊCH (CARE CAMP) — THEO TỪNG NHÂN VIÊN
// ----------------------------------------------------------------------------
// GET /api/care-camp/check
//   - Đọc cấu hình của TỪNG nhân viên trong collection "careCampEmployees".
//   - Nếu nhân viên không bật `running` => bỏ qua nhân viên đó.
//   - Với mỗi nhóm (adset) đang được giám sát:
//       * Gọi Meta Graph API lấy chỉ số hôm nay.
//       * Tính: tiêu (spend), CPM, giá mỗi KQ (CPR/CPL/CPC).
//       * Nếu tiêu > maxSpend VÀ giá > maxPrice VÀ CPM > maxCpm
//         => TẮT nhóm (status=PAUSED) và ghi log.
//       * Nếu số KQ tăng so với lần trước => TỰ NÂNG NGƯỠNG TIÊU
//         (maxSpend mới = maxSpend cũ + maxPrice * số KQ tăng thêm).
//
//   ?secret=xxx   nếu REPORT_SECRET đã cấu hình thì bắt buộc phải có secret
//   Header: x-report-secret: xxx
//
// Dùng cho cron (Task Scheduler / Vercel Cron) hoặc nút "Quét ngay" trên UI.
// ============================================================================

import { connectToDatabase } from "../../../lib/mongodb.js";
import { autoPauseEmployee } from "../../../lib/careCamp.mjs";
import { getEmployeeSettings } from "../../../lib/careCamp.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;
export const runtime = "nodejs";

function checkSecret(req, url) {
  const secret = (process.env.REPORT_SECRET || "").trim();
  if (!secret) return true; // dev: không bắt buộc
  const fromQuery = url.searchParams.get("secret");
  const fromHeader =
    req.headers.get("x-report-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return fromQuery === secret || fromHeader === secret;
}

export async function GET(req) {
  const url = new URL(req.url);

  if (!checkSecret(req, url)) {
    return Response.json({ error: "Secret không hợp lệ" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();

    // Danh sách nhân viên đang giám sát
    const configs = await db.collection("careCampEmployees").find({}).toArray();
    const actions = [];
    let checked = 0;

    for (const cfg of configs) {
      if (cfg.running === false) continue;

      const settings = await getEmployeeSettings(db, cfg.employeeName);
      if (!settings?.token) continue;
      if (!Array.isArray(settings.monitored) || !settings.monitored.length) continue;

      checked += 1;
      const { actions: empActions } = await autoPauseEmployee(db, settings);
      actions.push(...empActions);
    }

    return Response.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      employeesChecked: checked,
      actions,
    });
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/check:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
