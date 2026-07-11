import { connectToDatabase } from "../../../lib/mongodb.js";

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    const now = new Date();
    const nowIso = now.toISOString();

    for (const order of orders) {
      const lyDoMoi = (order.istickLyDo || "").toString();
      const doc = await db
        .collection("orders")
        .findOne(
          { id: order.id },
          { projection: { istickHistory: 1, istickLyDo: 1 } },
        );
      const oldHistory = Array.isArray(doc?.istickHistory)
        ? doc.istickHistory
        : [];
      const oldLyDo = (doc?.istickLyDo || "").toString();

      let newHistory = oldHistory;
      if (lyDoMoi.trim().length > 0 && lyDoMoi !== oldLyDo) {
        newHistory = [...oldHistory, { at: nowIso, lyDo: lyDoMoi }];
      }

      await db.collection("orders").updateOne(
        { id: order.id },
        {
          $set: {
            istickLyDo: lyDoMoi,
            istickHistory: newHistory,
          },
        },
      );
    }

    return new Response(
      JSON.stringify({ message: "Đã lưu lý do xử lý thành công" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstickHistory:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
