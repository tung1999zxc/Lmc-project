// ============================================================================
// CRON CHĂM SÓC CAMP — TỰ ĐỘNG HÀNG NGÀY
// ----------------------------------------------------------------------------
// GET /api/care-camp/cron
//   Chạy định kỳ (Task Scheduler / Vercel Cron):
//     1. Gom chỉ số Meta của từng nhân viên (theo tài khoản họ đã nhập)
//        -> careCampAdsetDaily
//     2. Tự động tắt nhóm vượt ngưỡng của nhân viên đang giám sát
//     3. Dựng + LƯU báo cáo ngày của từng nhân viên -> careCampDailyReports
//
//   ?snapshot=0    bỏ qua bước 1
//   ?save=0        bỏ qua bước 3
//   ?date=...      ngày cần xử lý (mặc định hôm nay giờ VN)
//   ?secret=xxx    bắt buộc nếu REPORT_SECRET / CRON_SECRET đã cấu hình
// ============================================================================

import {
  autoPauseAll,
  buildAndSaveDailyReports,
  fetchAdItems,
  getEmployeeSettings,
  getVnDateStr,
  listTrackedEmployees,
  recordEmployeeSamples,
  closeStaleAdsetWindows,
  withCareCampDb,
} from "../../../lib/careCamp.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;
export const runtime = "nodejs";

/** Kiểm tra secret (tương tự dailyReport.mjs). */
function checkSecret(req, url) {
  const accepted = [process.env.REPORT_SECRET, process.env.CRON_SECRET]
    .map((v) => (v || "").trim())
    .filter(Boolean);

  let provided = req.headers.get("x-report-secret");
  if (!provided) {
    const auth = req.headers.get("authorization");
    if (auth && /^bearer\s+/i.test(auth)) {
      provided = auth.replace(/^bearer\s+/i, "").trim();
    }
  }
  if (!provided) provided = url.searchParams.get("secret");
  provided = (provided || "").trim();

  if (provided) {
    return accepted.length === 0 ? true : accepted.includes(provided);
  }

  const ua = req.headers.get("user-agent") || "";
  if (ua.includes("vercel-cron")) return true;

  if (accepted.length === 0) return true;

  const sameOrigin =
    req.headers.get("sec-fetch-site") === "same-origin" ||
    req.headers.get("sec-fetch-site") === "none";
  if (sameOrigin) return true;

  return false;
}

export async function GET(req) {
  const url = new URL(req.url);
  if (!checkSecret(req, url)) {
    return Response.json({ error: "Secret không hợp lệ" }, { status: 401 });
  }

  try {
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date") || "")
      ? url.searchParams.get("date")
      : getVnDateStr();
    const doSnapshot = url.searchParams.get("snapshot") !== "0";
    const doSave = url.searchParams.get("save") !== "0";

    const out = await withCareCampDb(async (db) => {
      const result = { date: dateStr, at: new Date().toISOString() };

      // ----- 1) Gom chỉ số từng nhân viên -----
      if (doSnapshot) {
        const employees = await listTrackedEmployees(db);
        const snapResults = [];

        for (const emp of employees) {
          const settings = await getEmployeeSettings(db, emp.employeeName);
          if (!settings) continue;
          if (!settings.token || !settings.accounts.length) {
            snapResults.push({
              employeeName: emp.employeeName,
              ok: false,
              skipped: true,
              error: !settings.token
                ? "Chưa có Access Token"
                : "Chưa nhập tài khoản QC",
              adsets: 0,
            });
            continue;
          }

          try {
            const accountIds = settings.accounts.map((a) => a.id);
            const data = await fetchAdItems(
              accountIds,
              settings.token,
              dateStr,
              "adsets",
            );
            const allItems = data.flatMap((acc) =>
              (acc.items || []).map((it) => ({ ...it, accountId: acc.accountId })),
            );
            await recordEmployeeSamples(db, settings, allItems, dateStr);
            // Đóng cửa sổ cho nhóm đã theo dõi nhưng không còn phân phối
            await closeStaleAdsetWindows(
              db,
              settings,
              allItems,
              dateStr,
              {
                okAccountIds: data
                  .filter((d) => !d.error)
                  .map((d) => d.accountId),
              },
            );

            const errors = data.filter((d) => d.error).map((d) => d.error);
            snapResults.push({
              employeeName: emp.employeeName,
              ok: errors.length === 0,
              error: errors[0] || null,
              errors,
              accounts: accountIds.length,
              adsets: allItems.length,
            });
          } catch (err) {
            snapResults.push({
              employeeName: emp.employeeName,
              ok: false,
              error: err?.message || "Lỗi không xác định",
              adsets: 0,
            });
          }
        }

        result.snapshot = { date: dateStr, results: snapResults };
      }

      // ----- 2) Tự động tắt nhóm vượt ngưỡng -----
      try {
        result.autoPause = await autoPauseAll(db);
      } catch (err) {
        result.autoPause = [{ error: err?.message || "Lỗi auto-pause" }];
      }

      // ----- 3) Dựng + lưu báo cáo ngày -----
      if (doSave) {
        result.reports = await buildAndSaveDailyReports(db, dateStr);
      }

      return result;
    });

    return Response.json(out);
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/cron:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
