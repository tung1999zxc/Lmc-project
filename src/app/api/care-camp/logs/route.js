// ============================================================================
// NHẬT KÝ TỰ ĐỘNG TẮT / NÂNG NGƯỠNG (CARE CAMP)
// ----------------------------------------------------------------------------
// GET  /api/care-camp/logs?limit=100   -> danh sách log gần nhất
//      (thêm ?name=Nguyễn Văn A để chỉ lọc log của 1 nhân viên)
// DELETE /api/care-camp/logs?name=...  -> xoá log (toàn bộ hoặc của 1 NV)
// ============================================================================

import { connectToDatabase } from "../../../lib/mongodb.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOG_COLLECTION = "camp_auto_logs";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
    const name = (url.searchParams.get("name") || "").trim();

    const { db } = await connectToDatabase();
    const query = name ? { employeeName: name } : {};

    const logs = await db
      .collection(LOG_COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return Response.json({ data: logs });
  } catch (error) {
    console.error("Lỗi GET /api/care-camp/logs:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const name = (url.searchParams.get("name") || "").trim();

    const { db } = await connectToDatabase();
    const res = await db
      .collection(LOG_COLLECTION)
      .deleteMany(name ? { employeeName: name } : {});

    return Response.json({ success: true, deleted: res.deletedCount });
  } catch (error) {
    console.error("Lỗi DELETE /api/care-camp/logs:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
