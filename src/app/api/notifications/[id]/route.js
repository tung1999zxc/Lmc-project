// src/app/api/notifications/[id]/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';
import { ObjectId } from "mongodb";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const { user } = await req.json(); // user: tên người xác nhận

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin người xác nhận' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    // Bộ lọc dựa trên _id của thông báo (ObjectId)
    const filter = { _id: new ObjectId(id) };
    // Sử dụng $addToSet để thêm user vào mảng confirmed nếu chưa có
    const update = { $addToSet: { confirmed: user } };

    const result = await db.collection('notifications').updateOne(filter, update);
    if (result.modifiedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không cập nhật được thông báo hoặc đã xác nhận' }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ message: 'Xác nhận thông báo thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PATCH /api/notifications/[id]/confirm:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
