import { connectToDatabase } from '../../../../lib/mongodb2.js';


export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    if (!Array.isArray(orders) || orders.length === 0) {
      return new Response(JSON.stringify({ error: "Không có đơn để cập nhật" }), {
        status: 400,
      });
    }

    const bulkOps = orders.map((order) => ({
      updateOne: {
        filter: { stt: Number(order.stt) },
        update: {
          $set: {
            shippingDate1: "",
            deliveryStatus: "HOÀN",
            saleReport: "HOÀN",
            // istick: true,
          },
        },
      },
    }));

    const result = await db.collection("orders").bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Đã cập nhật ngày gửi",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstick:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}