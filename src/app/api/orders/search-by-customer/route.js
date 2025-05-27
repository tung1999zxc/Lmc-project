// src/app/api/orders/search-by-customer/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const customerName = url.searchParams.get('name');

    if (!customerName || customerName.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Thiếu tên khách hàng' }),
        { status: 400 }
      );
    }

    const orders = await db
      .collection('orders')
      .find({ customerName: { $regex: new RegExp(customerName, 'i') } }) // không phân biệt hoa thường
      .toArray();

    return new Response(
      JSON.stringify({ message: 'Tìm đơn theo tên khách thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi /api/orders/search-by-customer:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
