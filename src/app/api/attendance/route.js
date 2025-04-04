// src/app/api/attendance/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

/**
 * GET /api/attendance?month=YYYY-MM
 * Lấy dữ liệu chấm công của tháng được truyền vào (định dạng YYYY-MM)
 */
export async function GET(req) {
    try {
      const { db } = await connectToDatabase();
      // Lấy tất cả các bản ghi chấm công mà không lọc theo tháng
      const attendance = await db.collection('attendance').find({}).toArray();
      return new Response(
        JSON.stringify({ message: 'Lấy dữ liệu thành công', data: attendance }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Lỗi GET /api/attendance:', error);
      return new Response(JSON.stringify({ error: 'Lỗi server' }), { status: 500 });
    }
  }

/**
 * POST /api/attendance
 * Nhận payload gồm: date (YYYY-MM-DD), employeeId, type ('timeIn', 'timeOut', 'absence', 'reason') và value.
 * Dùng upsert để cập nhật hoặc tạo mới bản ghi chấm công cho ngày và nhân viên đó.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { date, employeeId, type, value } = body;
    const { db } = await connectToDatabase();
    // Lưu thêm trường month giúp truy vấn dễ hơn
    const month = date.slice(0, 7);
    // Cập nhật bản ghi chấm công cho ngày và nhân viên, nếu chưa có thì tạo mới
    await db.collection('attendance').updateOne(
      { date, employeeId },
      { $set: { [type]: value, month } },
      { upsert: true }
    );
    return new Response(
      JSON.stringify({ message: 'Cập nhật chấm công thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi POST /api/attendance:', error);
    return new Response(JSON.stringify({ error: 'Lỗi server' }), { status: 500 });
  }
}
