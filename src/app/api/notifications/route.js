// src/app/api/notifications/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Lọc theo thời gian (since) và giới hạn số lượng (limit) nếu được truyền vào
    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get('since');
    const limitParam = parseInt(searchParams.get('limit'), 10);

    const query = {};
    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        query.createdAt = { $gte: sinceDate };
      }
    }

    // Đảm bảo có index theo createdAt để lọc theo thời gian nhanh (idempotent)
    try {
      await db.collection('notifications').createIndex({ createdAt: -1 });
    } catch (idxErr) {
      console.warn('Không tạo được index notifications.createdAt:', idxErr?.message);
    }

    let cursor = db
      .collection('notifications')
      .find(query)
      .sort({ createdAt: -1 });

    if (!isNaN(limitParam) && limitParam > 0) {
      cursor = cursor.limit(limitParam);
    }

    const notifications = await cursor.toArray();

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
    const { message, author, department, recipients, type } = await req.json();

    // Kiểm tra các trường bắt buộc (bỏ qua department vì là tùy chọn)
    if (!message || !author || !recipients) {
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
      type: type || 'normal',

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
