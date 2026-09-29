// src/app/api/rulesCompany/ack-all/route.js
import { connectToDatabase } from "../../../lib/mongodb.js";

/**
 * POST /api/rulesCompany/ack-all
 *   body: { userKey, userName? }
 *   -> đánh dấu user đã đọc tất cả nội quy đang active
 *
 * Collection: rulesCompanyAck
 */

export async function POST(req) {
  try {
    const { userKey, userName = "" } = await req.json();
    if (!userKey) {
      return new Response(
        JSON.stringify({ error: "Thiếu userKey" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const rules = await db
      .collection("rulesCompany")
      .find({ active: { $ne: false } }, { projection: { id: 1 } })
      .toArray();

    const now = new Date();
    if (rules.length > 0) {
      const ops = rules.map((r) => ({
        updateOne: {
          filter: { userKey, ruleId: r.id },
          update: {
            $set: { userKey, ruleId: r.id, userName, readAt: now },
          },
          upsert: true,
        },
      }));
      await db.collection("rulesCompanyAck").bulkWrite(ops);
    }

    return new Response(
      JSON.stringify({
        message: "Đã đánh dấu đã đọc tất cả nội quy",
        data: { userKey, count: rules.length, readAt: now },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/rulesCompany/ack-all:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}