// src/app/api/employees/update-status/route.js
import { connectToDatabase } from '../../../lib/mongodb.js';

export async function POST(req) {
  try {
    const { name, status } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Thiếu tên nhân viên' }), { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('employees').updateOne(
      { name },
      { $set: { status: !!status } } // status là true/false
    );

    if (result.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy hoặc không thay đổi' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Cập nhật trạng thái thành công' }), { status: 200 });
  } catch (error) {
    console.error('Lỗi cập nhật status:', error);
    return new Response(JSON.stringify({ error: 'Lỗi server nội bộ' }), { status: 500 });
  }
}
