// src/app/api/orders/[id]/shipping/route.js
import { connectToDatabase } from '../../../../../lib/mongodb3.js';

export async function PATCH(request, { params }) {
  try {
    // Đợi params được giải quyết và lấy id từ URL
    const { id } = await params;
    // Lấy dữ liệu JSON từ request, mong đợi có { isShipping: boolean }
    const { isShipping } = await request.json();

    if (typeof isShipping !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Giá trị isShipping không hợp lệ' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Giả sử id được lưu dưới dạng string (ví dụ: Date.now().toString())
    const filter = { id };
    const update = { $set: { isShipping } };

    const result = await db.collection('orders').updateOne(filter, update);
    console.log("Update shipping result:", result);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy đơn hàng' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Cập nhật trạng thái đóng hàng thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PATCH /api/orders/[id]/shipping:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
