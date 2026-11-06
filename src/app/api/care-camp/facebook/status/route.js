// ============================================================================
// TRẠNG THÁI CẤU HÌNH FACEBOOK APP + DANH SÁCH TÀI KHOẢN QC
// ----------------------------------------------------------------------------
// GET /api/care-camp/facebook/status
//   -> cho biết server đã cấu hình FB App chưa, token nhân viên còn hạn không.
//
// GET /api/care-camp/facebook/accounts
//   -> lấy danh sách tài khoản QC mà token của nhân viên đang đăng nhập có quyền.
//   (dùng header x-employee-name)
// ============================================================================

import { connectToDatabase } from "../../../../lib/mongodb.js";
import { getEmployeeSettings } from "../../../../lib/careCamp.mjs";
import { fetchAdAccounts, getFbAppConfig } from "../../../../lib/facebookOAuth.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getEmployeeName(req) {
  return (
    req.headers.get("x-employee-name") ||
    req.headers.get("x-employee") ||
    ""
  ).trim();
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "status";

    const { configured, appId } = getFbAppConfig();

    // ---- Chế độ: lấy danh sách tài khoản QC ----
    if (mode === "accounts") {
      const employeeName = getEmployeeName(req);
      if (!employeeName) {
        return Response.json(
          { error: "Thiếu thông tin nhân viên đang đăng nhập" },
          { status: 400 },
        );
      }

      const { db } = await connectToDatabase();
      const settings = await getEmployeeSettings(db, employeeName);
      if (!settings?.token) {
        return Response.json(
          { error: "Chưa có Access Token. Hãy bấm 'Lấy token tự động'." },
          { status: 400 },
        );
      }

      try {
        const accounts = await fetchAdAccounts(settings.token);
        return Response.json({
          data: accounts.map((a) => ({
            id: String(a.id || "").replace(/^act_/i, ""),
            name: a.name || a.id,
            currency: a.currency || "",
            status: a.account_status ?? "",
            role: a.role || "",
          })),
        });
      } catch (err) {
        return Response.json(
          { error: err?.message || "Không lấy được danh sách tài khoản QC" },
          { status: 400 },
        );
      }
    }

    // ---- Chế độ: trạng thái ----
    const employeeName = getEmployeeName(req);
    let hasToken = false;
    let tokenExpiresAt = null;
    let accountsCount = 0;

    if (employeeName) {
      const { db } = await connectToDatabase();
      const settings = await getEmployeeSettings(db, employeeName);
      hasToken = !!settings?.token;
      accountsCount = settings?.accounts?.length || 0;
    }

    return Response.json({
      data: {
        fbAppConfigured: configured,
        fbAppId: appId || "",
        hasToken,
        tokenExpiresAt,
        accountsCount,
        loginUrl: configured
          ? `/api/care-camp/facebook/login?employee=${encodeURIComponent(
              employeeName || "",
            )}`
          : null,
      },
    });
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/facebook/status:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
