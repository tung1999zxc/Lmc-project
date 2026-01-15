// src/app/api/orders/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb2.js";

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Chỉ lấy đơn có saleReport = DONE
    const query = {
      saleReport: "DONE",
    };

    // Chỉ lấy các field cần thiết
    const projection = {
      _id: 0, // nếu KHÔNG muốn trả về _id
      products: 1,
      deliveryStatus: 1,
      profit: 1,
      saleReport: 1,
    };

    const orders = await db
      .collection("orders")
      .find(query, { projection })
      .toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách đơn hàng DONE thành công",
        data: orders,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
