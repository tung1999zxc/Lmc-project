// src/app/api/orderskho/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "failed";

    // ✅ Lấy mốc thời gian 4 tháng trước
    const now = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(now.getMonth() - 4);

    let query = {
      // ✅ luôn lọc theo 4 tháng gần nhất
      createdAt: { $gte: fourMonthsAgo }
    };

    if (filter === "failed") {
      query.$and = [
        { saleReport: "DONE" },
        {
          $or: [
            { paymentStatus: { $ne: "ĐÃ THANH TOÁN" } },
            { deliveryStatus: { $ne: "GIAO THÀNH CÔNG" } }
          ]
        }
      ];
    } else if (filter === "success") {
      query.saleReport = "DONE";
      query.deliveryStatus = "GIAO THÀNH CÔNG";
    } else if (filter === "all") {
      query.saleReport = "DONE";
    }

    const orders = await db.collection('orders')
      .find(query)
      .sort({ createdAt: -1 }) // optional: mới nhất lên đầu
      .toArray();

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