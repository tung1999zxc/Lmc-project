// src/app/api/pageName/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Lấy toàn bộ đơn hàng từ collection "orders3"
    const orders = await db.collection('pageName').find({}).toArray();

    return new Response(
      JSON.stringify({ message: 'Lấy danh sách đơn hàng thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi GET /api/pageName:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { pageName, employee } = await req.json();

    if (!pageName || !employee) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin cần thiết: pageName hoặc employee' }),
        { status: 400 }
      );
    }

    // Tạo đối tượng đơn hàng mới
    const newOrder = {
      key: Date.now(), // Dùng timestamp làm định danh duy nhất
      pageName,
      employee,
      createdAt: new Date()
    };

    const { db } = await connectToDatabase();
    await db.collection('pageName').insertOne(newOrder);

    return new Response(
      JSON.stringify({ message: 'Thêm đơn hàng thành công', data: newOrder }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi POST /api/pageName:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
