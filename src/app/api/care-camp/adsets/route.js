// ============================================================================
// DANH SÁCH NHÓM / CHIẾN DỊCH — VÀ TỰ ĐỘNG GHI BÁO CÁO
// ----------------------------------------------------------------------------
// GET /api/care-camp/adsets?ids=123,456
//   - Lấy token của NHÂN VIÊN ĐANG ĐĂNG NHẬP (header x-employee-name).
//   - Trả về nhóm (adset) đang chạy + chỉ số hôm nay của từng nhóm.
//   - *** TỰ ĐỘNG: ghi snapshot từng nhóm vào `careCampAdsetDaily` và LƯU
//       báo cáo ngày vào `careCampDailyReports`. ***
//     => Chỉ cần nhân viên mở web là có báo cáo, không cần thao tác gì thêm.
//
// GET /api/care-camp/campaigns?ids=123,456
//   - Tương tự nhưng trả về chiến dịch.
//
// POST /api/care-camp/adsets  { adsetId, action: "pause" | "resume" }
// POST /api/care-camp/campaigns { campaignId, action: "pause" | "resume" }
//   - Bật/tắt thủ công từ UI. Sau khi tắt sẽ ghi lại snapshot + báo cáo.
// ============================================================================

import { connectToDatabase } from "../../../lib/mongodb.js";
import {
  fetchAdItems,
  getEmployeeSettings,
  getVnDateStr,
  recordEmployeeSamples,
  closeStaleAdsetWindows,
  saveEmployeeDailyReport,
} from "../../../lib/careCamp.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;
export const runtime = "nodejs";

function getEmployeeName(req) {
  return (
    req.headers.get("x-employee-name") ||
    req.headers.get("x-employee") ||
    ""
  ).trim();
}

function cleanIds(raw) {
  return String(raw || "")
    .split(/[\s,;]+/)
    .map((s) => s.replace(/^act_/i, "").trim())
    .filter(Boolean);
}

/* --------------------------------------------------------------------------
 * GET
 * -------------------------------------------------------------------------- */
export async function GET(req) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "adsets";
  const ids = cleanIds(url.searchParams.get("ids"));
  const employeeName = getEmployeeName(req);

  if (!ids.length) {
    return Response.json({ error: "Thiếu danh sách ID tài khoản" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  // Token của nhân viên đang đăng nhập (fallback sang token chung)
  let token = "";
  let settings = null;
  if (employeeName) {
    settings = await getEmployeeSettings(db, employeeName);
    token = settings?.token || "";
  }
  if (!token) {
    const doc = await db.collection("camp_settings").findOne({ _id: "global" });
    token = (doc?.token || "").trim();
  }

  if (!token) {
    return Response.json(
      { error: "Chưa cấu hình Access Token. Hãy nhập token ở trang Care Camp." },
      { status: 400 },
    );
  }

  const dateStr = getVnDateStr();
  const data = await fetchAdItems(ids, token, dateStr, type);

  // ---- TỰ ĐỘNG LƯU BÁO CÁO ----
  // Gom tất cả nhóm (kể cả nhóm đã tắt) rồi ghi snapshot + dựng báo cáo.
  let autoSaved = null;
  if (employeeName && type === "adsets") {
    try {
      const allItems = data.flatMap((acc) =>
        (acc.items || []).map((it) => ({ ...it, accountId: acc.accountId })),
      );
      await recordEmployeeSamples(
        db,
        settings || { employeeName },
        allItems,
        dateStr,
      );
      // Nhóm đã theo dõi nhưng không còn phân phối -> đóng cửa sổ hoạt động.
      // CHỈ đóng cho nhóm thuộc tài khoản quét thành công (không lỗi),
      // tránh đóng nhầm khi 1 tài khoản lỗi mạng/token.
      const okAccountIds = new Set(
        data.filter((acc) => !acc.error).map((acc) => acc.accountId),
      );
      const closed = await closeStaleAdsetWindows(
        db,
        settings || { employeeName },
        allItems,
        dateStr,
        { okAccountIds },
      );
      const payload = await saveEmployeeDailyReport(
        db,
        settings?.employeeName || employeeName,
        dateStr,
        { settings },
      );
      autoSaved = {
        employeeName: payload.employeeName,
        totalAdsets: payload.summary.totalAdsets,
        activeAdsets: payload.summary.activeAdsets,
        totalSpend: payload.summary.totalSpend,
        totalResults: payload.summary.totalResults,
        activeDuration: payload.summary.activeDuration,
        closedStale: closed.length,
      };
    } catch (e) {
      console.error("Lỗi tự động lưu báo cáo care camp:", e);
      // Không làm fail request chính
    }
  }

  return Response.json({ data, type, date: dateStr, autoSaved });
}

/* --------------------------------------------------------------------------
 * POST — bật/tắt thủ công
 * -------------------------------------------------------------------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const { db } = await connectToDatabase();
    const employeeName = getEmployeeName(req);

    let token = "";
    let settings = null;
    if (employeeName) {
      settings = await getEmployeeSettings(db, employeeName);
      token = settings?.token || "";
    }
    if (!token) {
      const doc = await db.collection("camp_settings").findOne({ _id: "global" });
      token = (doc?.token || "").trim();
    }

    if (!token) {
      return Response.json({ error: "Chưa cấu hình Access Token" }, { status: 400 });
    }

    const isCampaign = body.type === "campaign";
    const id = isCampaign ? body.campaignId : body.adsetId;
    if (!id) {
      return Response.json({ error: "Thiếu ID" }, { status: 400 });
    }

    const status = body.action === "resume" ? "ACTIVE" : "PAUSED";

    const gUrl = new URL(`https://graph.facebook.com/v20.0/${id}`);
    gUrl.searchParams.set("status", status);
    gUrl.searchParams.set("access_token", token);
    const gRes = await fetch(gUrl.toString(), { method: "POST" });
    const res = await gRes.json();

    if (res?.error) {
      return Response.json(
        { error: res.error.message || "Lỗi Graph API", success: false },
        { status: 400 },
      );
    }

    // ---- Ghi lại snapshot + báo cáo sau khi bật/tắt ----
    if (employeeName && !isCampaign) {
      try {
        const dateStr = getVnDateStr();
        await recordEmployeeSamples(
          db,
          settings || { employeeName },
          [
            {
              id,
              name: body.name || "",
              status,
              accountId: body.accountId || "",
              accountName: body.accountName || "",
              campaignId: body.campaignId || "",
              campaignName: body.campaignName || "",
              metrics: body.metrics || {},
            },
          ],
          dateStr,
        );
        await saveEmployeeDailyReport(
          db,
          settings?.employeeName || employeeName,
          dateStr,
          { settings },
        );
      } catch (e) {
        console.error("Lỗi lưu báo cáo sau khi bật/tắt:", e);
      }
    }

    return Response.json({ success: true, status, data: res });
  } catch (error) {
    console.error("Lỗi POST /api/care-camp/adsets:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
