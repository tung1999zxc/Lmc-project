// src/app/api/orders/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Không cần lấy params
    const orders = await db.collection('orders').find({}).toArray();

    return new Response(
      JSON.stringify({ message: 'Lấy tất cả đơn hàng thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}