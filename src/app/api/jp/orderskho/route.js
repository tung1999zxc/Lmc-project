// src/app/api/orderskho/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb2.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "failed";

    let query = {};

    if (filter === "failed") {
      // Đơn đã được sale xử lý, nhưng chưa thanh toán hoặc chưa giao
      query = {
        $and: [
          { saleReport: "DONE" },
          {
            $or: [
              { paymentStatus: { $ne: "ĐÃ THANH TOÁN" } },
              { deliveryStatus: { $ne: "GIAO THÀNH CÔNG" } }
            ]
          }
        ]
      };
    } else if (filter === "success") {
      // Đơn đã giao thành công và được sale xử lý
      query = {
        deliveryStatus: "GIAO THÀNH CÔNG",
        saleReport: "DONE"
      };
    } else if (filter === "all") {
      // Tất cả đơn đã được sale xử lý
      query = {
        saleReport: "DONE"
      };
    }

    const orders = await db.collection('orders').find(query).toArray();

    return new Response(
      JSON.stringify({ message: 'Lấy đơn hàng kho thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orderskho:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
