// src/app/api/recordsMKT/route.js
import { connectToDatabase } from '../../../lib/mongodb3.js';
import moment from "moment";
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const { db } = await connectToDatabase();

    let query = {};
    if (start && end) {
      query.date = {
        $gte: moment(start).format("YYYY-MM-DD"),
        $lte: moment(end).format("YYYY-MM-DD"),
      };
    }

    const records = await db.collection("recordsMKT").find(query).toArray();

    return new Response(
      JSON.stringify({ message: "Lấy danh sách thành công", data: records }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Lỗi GET /api/recordsMKT:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { id, date, oldMoney,tiendu, request1,isLocked,totalReceived, request2, excessMoney, teamnv, adsMoney, adsMoney2, name, userId } = await req.json();

    // Có thể thêm kiểm tra các trường bắt buộc nếu cần
    if (!id || !date) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const newRecord = {
      id, // id thường được tạo bằng Date.now() và là số
      date,
      oldMoney,
      request1,
      request2,
      excessMoney,
      totalReceived,
      teamnv,
      adsMoney,
      adsMoney2,
      tiendu,
      name,
      userId,
      isLocked,
      createdAt: new Date()
    };

    const { db } = await connectToDatabase();
    await db.collection('recordsMKT').insertOne(newRecord);

    return new Response(
      JSON.stringify({ message: 'Thêm mới thành công', data: newRecord }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/recordsMKT:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
