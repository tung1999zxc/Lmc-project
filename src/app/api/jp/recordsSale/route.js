// src/app/api/recordsSale/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb2.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    // Lấy tất cả các record từ collection "records"
    const records = await db.collection('recordsSale').find({}).toArray();
    return new Response(
      JSON.stringify({ message: 'Lấy danh sách thành công', data: records }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/recordsSale:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const {
      id,
      date,
      newMess,
      closedOrders,
      dailySales,
      totalRemarketing,
      ratio,
      employeeId,
      employeeName,
    } = await req.json();

    // Kiểm tra một số trường bắt buộc (bạn có thể mở rộng kiểm tra nếu cần)
    if (!id || !date) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const newRecord = {
      id, // định danh duy nhất, kiểu số
      date, // kiểu string "YYYY-MM-DD"
      newMess,
      closedOrders,
      dailySales,
      totalRemarketing,
      ratio,
      employeeId,
      employeeName,
      createdAt: new Date(),
    };

    const { db } = await connectToDatabase();
    await db.collection('recordsSale').insertOne(newRecord);

    return new Response(
      JSON.stringify({ message: 'Thêm mới thành công', data: newRecord }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/recordsSale:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
