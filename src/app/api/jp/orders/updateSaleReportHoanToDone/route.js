import { connectToDatabase } from "../../../../../app/lib/mongodb2.js";

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    if (!Array.isArray(orders) || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: "Không có đơn để cập nhật" }),
        {
          status: 400,
        },
      );
    }

    const bulkOps = orders.map((order) => ({
      updateOne: {
        filter: { stt: Number(order.stt), saleReport: "HOÀN" },
        update: {
          $set: {
            saleReport: "DONE",
          },
        },
      },
    }));

    const result = await db.collection("orders").bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Đã cập nhật saleReport từ HOÀN sang DONE",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/jp/orders/updateSaleReportHoanToDone:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
