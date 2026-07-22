// src/app/api/orders/update-payment-status/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb2.js';

export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();

    // Cập nhật tất cả đơn hàng
    const result = await db.collection('orders').updateMany(
      {}, // tất cả document
      {
        $set: {
          paymentStatus: "ĐÃ THANH TOÁN",
          
        }
      }
    );

    return new Response(
      JSON.stringify({
        message: "Cập nhật paymentStatus thành ĐÃ THANH TOÁN cho tất cả đơn hàng thành công",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PUT /api/orders/update-payment-status:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
