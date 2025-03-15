// src/app/api/notifications/[id]/confirm/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb.js';
import { ObjectId } from "mongodb";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const { user } = await req.json(); // lấy tên người xác nhận

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin người xác nhận' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    // Sử dụng ObjectId vì _id của MongoDB là ObjectId
    const filter = { _id: new ObjectId(id) };
    // Thêm user vào mảng confirmed nếu chưa có (sử dụng $addToSet)
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
