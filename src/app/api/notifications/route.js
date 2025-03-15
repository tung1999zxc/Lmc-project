// src/app/api/notifications/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    // Lấy tất cả thông báo, sắp xếp theo createdAt giảm dần
    const notifications = await db
      .collection('notifications')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return new Response(
      JSON.stringify({
        message: 'Lấy danh sách thông báo thành công',
        data: notifications,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi GET /api/notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { message, author, department, recipients } = await req.json();

    // Kiểm tra các trường bắt buộc (bỏ qua department vì là tùy chọn)
    if (!message || !author || !recipients ) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const newNotification = {
      message,
      author,
      // Nếu không chọn department, set về null
      department: department || null,
      recipients,
      
      createdAt: new Date(),
      confirmed: [], // Ban đầu chưa ai xác nhận
    };

    const { db } = await connectToDatabase();
    await db.collection('notifications').insertOne(newNotification);

    return new Response(
      JSON.stringify({
        message: 'Tạo thông báo thành công',
        data: newNotification,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi POST /api/notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
