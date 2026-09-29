// src/app/api/rulesCompany/ack/[id]/route.js
import { connectToDatabase } from "../../../../lib/mongodb.js";

/**
 * POST /api/rulesCompany/ack/[id]
 *   body: { userKey, userName }
 *   -> đánh dấu user đã đọc nội quy có id = [id]
 *
 * GET  /api/rulesCompany/ack/[id]
 *   query: ?userKey=xxx
 *   -> kiểm tra user đã đọc chưa (trả về { read: boolean, readAt })
 *
 * Collection: rulesCompanyAck
 *   { userKey, ruleId, readAt }
 */

function parseId(raw) {
  if (raw === null || raw === undefined) return null;
  // Bỏ mọi ký tự không phải số (phòng trường hợp id lẫn ký tự)
  const cleaned = String(raw).replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req, { params }) {
  try {
    // Next.js 15: params là Promise, cần await trước khi truy cập
    const resolvedParams = await params;
    console.log(
      "[api/rulesCompany/ack/[id]] POST params =",
      JSON.stringify(resolvedParams)
    );
    const ruleId = parseId(resolvedParams?.id);
    if (ruleId === null) {
      console.error(
        "[api/rulesCompany/ack/[id]] POST id không hợp lệ:",
        resolvedParams?.id
      );
      return new Response(
        JSON.stringify({
          error: "ID nội quy không hợp lệ",
          received: resolvedParams?.id,
        }),
        { status: 400 }
      );
    }

    const { userKey, userName: bodyUserName = "" } = await req.json();
    if (!userKey) {
      return new Response(
        JSON.stringify({ error: "Thiếu userKey" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    await db.collection("rulesCompanyAck").updateOne(
      { userKey, ruleId },
      { $set: { userKey, ruleId, userName: bodyUserName, readAt: now } },
      { upsert: true }
    );

    return new Response(
      JSON.stringify({ message: "Đã xác nhận đã đọc", data: { userKey, ruleId, readAt: now } }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/rulesCompany/ack/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    // Next.js 15: params là Promise, cần await trước khi truy cập
    const resolvedParams = await params;
    const ruleId = parseId(resolvedParams?.id);
    if (ruleId === null) {
      return new Response(
        JSON.stringify({
          error: "ID nội quy không hợp lệ",
          received: resolvedParams?.id,
        }),
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userKey = searchParams.get("userKey");
    if (!userKey) {
      return new Response(
        JSON.stringify({ error: "Thiếu userKey" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const ack = await db
      .collection("rulesCompanyAck")
      .findOne({ userKey, ruleId });

    return new Response(
      JSON.stringify({
        message: "OK",
        data: { read: Boolean(ack), readAt: ack?.readAt || null },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/rulesCompany/ack/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}