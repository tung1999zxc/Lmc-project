// src/app/api/notifications/[id]/confirm/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb.js';
import { ObjectId } from "mongodb";

export async function PATCH(req, context) {
  try {
    const params = await context.params;  // ✔️ UNWRAP params (NEXT 16)
    const { id } = params;

    const { user } = await req.json(); // lấy tên người xác nhận

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin người xác nhận' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const filter = { _id: new ObjectId(id) };

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
