// src/app/api/orders/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb2.js";

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Chỉ lọc đơn có saleReport là DONE
    const query = {
      saleReport: "DONE",
    };

    const orders = await db.collection("orders").find(query).toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách đơn hàng DONE thành công",
        data: orders,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
