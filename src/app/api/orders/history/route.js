// src/app/api/orders/history/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    // Lấy tất cả các bản ghi lịch sử chỉnh sửa, sắp xếp theo thời gian mới nhất
    const history = await db.collection('orderHistory').find({}).toArray();
    return new Response(
      JSON.stringify({ message: 'Lấy danh sách history thành công', data: history }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orders/history", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
