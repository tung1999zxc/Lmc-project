// ============================================================================
// CẤU HÌNH CARE CAMP CỦA NHÂN VIÊN ĐANG ĐĂNG NHẬP
// ----------------------------------------------------------------------------
// Mỗi nhân viên tự cấu hình trên web (token, tài khoản QC, ngưỡng).
// Cấu hình lưu riêng trong `careCampEmployees` theo tên nhân viên.
// Admin KHÔNG cần thiết lập gì — chỉ đọc báo cáo.
//
// GET /api/care-camp/my-settings
//   -> cấu hình của nhân viên đang đăng nhập (token đã che)
//
// PUT /api/care-cập/my-settings
//   body: { token?, accounts?, maxSpend?, maxPrice?, maxCpm?, useCpl?, useCpc?,
//           pauseCampaignToo?, running?, monitored?, prevResults? }
//   -> lưu cấu hình của nhân viên đang đăng nhập
//
// DELETE /api/care-camp/my-settings
//   -> xoá cấu hình + snapshot + báo cáo của nhân viên đang đăng nhập
// ============================================================================

import { connectToDatabase } from "../../../lib/mongodb.js";
import {
  COL_ADSET_DAILY,
  COL_EMPLOYEES,
  COL_REPORTS,
  getEmployeeSettings,
  saveEmployeeSettings,
} from "../../../lib/careCamp.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/** Lấy tên nhân viên từ header do client gửi lên. */
function getEmployeeName(req) {
  return (
    req.headers.get("x-employee-name") ||
    req.headers.get("x-employee") ||
    ""
  ).trim();
}

function maskToken(token) {
  if (!token) return "";
  const s = String(token);
  return s.length <= 8 ? "••••" : `••••••${s.slice(-6)}`;
}

export async function GET(req) {
  try {
    const employeeName = getEmployeeName(req);
    if (!employeeName) {
      return Response.json(
        { error: "Thiếu thông tin nhân viên đang đăng nhập" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const settings = await getEmployeeSettings(db, employeeName);

    return Response.json({
      data: {
        ...settings,
        token: maskToken(settings.token),
        hasToken: !!settings.token,
      },
    });
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/my-settings:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const employeeName = getEmployeeName(req);
    if (!employeeName) {
      return Response.json(
        { error: "Thiếu thông tin nhân viên đang đăng nhập" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { db } = await connectToDatabase();

    const patch = {};
    if (typeof body.token === "string" && body.token.trim()) {
      patch.token = body.token.trim();
    }
    if (body.accounts !== undefined) {
      patch.accounts = (Array.isArray(body.accounts) ? body.accounts : []).map(
        (a) => ({
          id: String(a.id || "").replace(/^act_/i, "").trim(),
          name: String(a.name || a.id || "").trim(),
        }),
      );
    }
    if (body.monitored !== undefined) {
      patch.monitored = (Array.isArray(body.monitored) ? body.monitored : []).map(
        (m) => ({
          adsetId: String(m.adsetId || "").trim(),
          accountId: String(m.accountId || "").trim(),
          accountName: String(m.accountName || "").trim(),
          name: String(m.name || "").trim(),
          campaignName: String(m.campaignName || "").trim(),
          maxSpend: Number(m.maxSpend) || 0,
          maxPrice: Number(m.maxPrice) || 0,
          maxCpm: Number(m.maxCpm) || 0,
        }),
      );
    }
    if (body.prevResults !== undefined) {
      patch.prevResults = body.prevResults;
    }
    ["maxSpend", "maxPrice", "maxCpm"].forEach((k) => {
      if (body[k] !== undefined && body[k] !== null && body[k] !== "") {
        const v = Number(body[k]);
        if (Number.isFinite(v)) patch[k] = v;
      }
    });
    ["useCpl", "useCpc", "pauseCampaignToo", "running"].forEach((k) => {
      if (typeof body[k] === "boolean") patch[k] = body[k];
    });

    const saved = await saveEmployeeSettings(db, employeeName, patch);

    return Response.json({
      message: "Đã lưu cấu hình",
      data: {
        ...saved,
        token: maskToken(saved.token),
        hasToken: !!saved.token,
      },
    });
  } catch (error) {
    console.error("Lỗi PUT /api/care-camp/my-settings:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const employeeName = getEmployeeName(req);
    if (!employeeName) {
      return Response.json(
        { error: "Thiếu thông tin nhân viên đang đăng nhập" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    await db.collection(COL_EMPLOYEES).deleteOne({ employeeName });
    await db.collection(COL_ADSET_DAILY).deleteMany({ employeeName });
    await db.collection(COL_REPORTS).deleteMany({ employeeName });

    return Response.json({ message: "Đã xoá cấu hình của nhân viên" });
  } catch (error) {
    console.error("Lỗi DELETE /api/care-camp/my-settings:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
