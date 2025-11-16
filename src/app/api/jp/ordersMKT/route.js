// src/app/api/orders/route.js
import { connectToDatabase } from '../../../lib/mongodb2.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
const { searchParams } = new URL(req.url);
const start = searchParams.get('start');
const end = searchParams.get('end');
let query = {};
if (start && end) {
  query.orderDate = { $gte: start, $lte: end };
}

    // Chỉ lấy các trường cần thiết
    const projection = {
      orderDate: 1,
      revenue: 1,
      profit: 1,
      mkt: 1,
      salexuly: 1,
      saleReport: 1,
      processStatus: 1,
      paymentStatus: 1,
      deliveryStatus: 1,
      
      employee_code_order: 1,
      stt: 1,
      _id: 0 // Ẩn _id nếu không cần
    };

    const orders = await db.collection('orders').find(query, { projection }).toArray();

    return new Response(
      JSON.stringify({ message: 'Lấy danh sách đơn hàng thành công', data: orders }),
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
