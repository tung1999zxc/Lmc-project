// ============================================================================
// CẤU HÌNH CHĂM SÓC CAMP (token, tài khoản, ngưỡng tự động tắt)
// ----------------------------------------------------------------------------
// Lưu 1 document duy nhất trong collection "camp_settings" (_id = "global").
// Token được giữ server-side để endpoint /api/care-camp/check (cron) dùng được.
//
// Document:
//   {
//     _id: "global",
//     token: String,
//     accounts: [{ id, name }],
//     maxSpend, maxPrice, maxCpm: Number,
//     useCpl, useCpc, running: Boolean,
//     monitored: [{ adsetId, accountId, accountName, name, campaignName,
//                   maxSpend, maxPrice, maxCpm }],
//     prevResults: { [adsetId]: Number },
//     updatedAt: Date,
//   }
// ============================================================================

import { connectToDatabase } from "../../../lib/mongodb.js";

const COLLECTION = "camp_settings";
const DOC_ID = "global";

const DEFAULTS = {
  token: "",
  accounts: [],
  maxSpend: 10000,
  maxPrice: 12000,
  maxCpm: 50000,
  useCpl: false,
  useCpc: false,
  pauseCampaignToo: false,
  running: false,
  monitored: [],
  prevResults: {},
};

async function getDoc(db) {
  const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
  return { ...DEFAULTS, ...(doc || {}) };
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const doc = await getDoc(db);
    // Không trả token ra ngoài (chỉ trả trạng thái đã cấu hình)
    return Response.json({
      data: {
        ...doc,
        token: doc.token ? "••••••" + String(doc.token).slice(-6) : "",
        hasToken: !!doc.token,
      },
    });
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/settings:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { db } = await connectToDatabase();

    const patch = {};
    if (typeof body.token === "string" && body.token.trim()) {
      patch.token = body.token.trim();
    }
    if (Array.isArray(body.accounts)) {
      patch.accounts = body.accounts
        .map((a) => ({ id: String(a.id || ""), name: a.name || String(a.id || "") }))
        .filter((a) => a.id);
    }
    ["maxSpend", "maxPrice", "maxCpm"].forEach((k) => {
      if (body[k] !== undefined && body[k] !== null && body[k] !== "") {
        const v = Number(body[k]);
        if (Number.isFinite(v)) patch[k] = v;
      }
    });
    ["useCpl", "useCpc", "running", "pauseCampaignToo"].forEach((k) => {
      if (typeof body[k] === "boolean") patch[k] = body[k];
    });
    if (Array.isArray(body.monitored)) {
      patch.monitored = body.monitored.map((m) => ({
        adsetId: String(m.adsetId || ""),
        accountId: String(m.accountId || ""),
        accountName: m.accountName || "",
        name: m.name || "",
        campaignName: m.campaignName || "",
        maxSpend: Number(m.maxSpend) || 0,
        maxPrice: Number(m.maxPrice) || 0,
        maxCpm: Number(m.maxCpm) || 0,
      }));
    }
    if (body.prevResults && typeof body.prevResults === "object") {
      patch.prevResults = body.prevResults;
    }
    if (body.clearToken === true) patch.token = "";

    patch.updatedAt = new Date();
    await db
      .collection(COLLECTION)
      .updateOne({ _id: DOC_ID }, { $set: patch }, { upsert: true });

    const saved = await getDoc(db);
    return Response.json({
      message: "Đã lưu cấu hình",
      data: {
        ...saved,
        token: saved.token ? "••••••" + String(saved.token).slice(-6) : "",
        hasToken: !!saved.token,
      },
    });
  } catch (error) {
    console.error("Lỗi PUT /api/care-camp/settings:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
