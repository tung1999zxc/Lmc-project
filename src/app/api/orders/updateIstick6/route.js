import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    const updates = orders.map((order) => ({
      updateOne: {
        filter: { id: order.id },
        update: {
          $set: {
            istick6: order.istick6,
            ...(order.istick6 === false
              ? { isShippingName: order.isShippingName ?? "" }
              : {}),
          },
        },
      },
    }));

    await db.collection("orders").bulkWrite(updates);

    return new Response(
      JSON.stringify({
        message: "Đã cập nhật istick6 cho các đơn hàng thành công",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstick6:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
