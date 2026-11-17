// src/app/api/notifications/[id]/read/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb.js';
import { ObjectId } from "mongodb";

// Đánh dấu đã đọc (dùng cho thông báo liên quan xóa đơn - không cần "xác nhận")
export async function PATCH(req, context) {
  try {
    const params = await context.params; // UNWRAP params (NEXT 16)
    const { id } = params;

    const { user } = await req.json(); // lấy tên người đánh dấu đã đọc

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin người dùng' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const filter = { _id: new ObjectId(id) };
    const update = { $addToSet: { readBy: user } };

    const result = await db.collection('notifications').updateOne(filter, update);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy thông báo' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Đánh dấu đã đọc thành công' }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Lỗi PATCH /api/notifications/[id]/read:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
