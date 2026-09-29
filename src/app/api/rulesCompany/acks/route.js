// src/app/api/rulesCompany/acks/route.js
import { connectToDatabase } from "../../../lib/mongodb.js";

/**
 * GET  /api/rulesCompany/acks?userKey=xxx
 *   -> trả về danh sách ruleId mà user đã đọc
 *
 * POST /api/rulesCompany/acks/mark-all
 *   body: { userKey, userName? }
 *   -> đánh dấu user đã đọc tất cả nội quy đang active
 */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userKey = searchParams.get("userKey");
    if (!userKey) {
      return new Response(
        JSON.stringify({ error: "Thiếu userKey" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const acks = await db
      .collection("rulesCompanyAck")
      .find({ userKey })
      .toArray();

    return new Response(
      JSON.stringify({
        message: "OK",
        data: acks.map((a) => ({
          ruleId: a.ruleId,
          readAt: a.readAt,
        })),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/rulesCompany/acks:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}