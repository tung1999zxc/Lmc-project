// src/app/api/xin-ads/route.js
import { connectToDatabase } from '../../lib/mongodb.js';

export async function POST(req) {
  try {
    const { date, amount, type, user, userId, teamnv, stk, nh } = await req.json();

    if (!date || !amount || !user) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Tìm báo cáo của user trong ngày
    const existingRecord = await db.collection("recordsMKT").findOne({
      userId: parseInt(userId) || 0,
      date: date
    });

    let result;

    if (existingRecord) {
      // Cộng thêm vào báo cáo hiện tại
      const updateData = {};
      if (type === "sang") {
        updateData.request1 = (existingRecord.request1 || 0) + parseInt(amount);
      } else if (type === "chieu") {
        updateData.request2 = (existingRecord.request2 || 0) + parseInt(amount);
      } else if (type === "gap") {
        updateData.request3 = (existingRecord.request3 || 0) + parseInt(amount);
      } else if (type === "all") {
        updateData.request1 = (existingRecord.request1 || 0) + parseInt(amount);
        updateData.request2 = (existingRecord.request2 || 0) + parseInt(amount);
        updateData.request3 = (existingRecord.request3 || 0) + parseInt(amount);
      }
      
      await db.collection("recordsMKT").updateOne(
        { _id: existingRecord._id },
        { $set: updateData }
      );
      result = { message: 'Đã cộng thêm vào báo cáo ngày ' + date };
    } else {
      // Tạo báo cáo mới
      const newRecord = {
        id: Date.now(),
        date: date,
        oldMoney: 0,
        request1: type === "sang" || type === "all" ? parseInt(amount) : 0,
        request2: type === "chieu" || type === "all" ? parseInt(amount) : 0,
        request3: type === "gap" || type === "all" ? parseInt(amount) : 0,
        excessMoney: 0,
        totalReceived: 0,
        tiendu: 0,
        teamnv: teamnv || '',
        adsMoney: parseInt(amount),
        adsMoney2: 0,
        stk: stk || '',
        nh: nh || '',
        name: user,
        userId: parseInt(userId) || 0,
        isLocked: false,
        createdAt: new Date()
      };

      await db.collection("recordsMKT").insertOne(newRecord);
      result = { message: 'Đã tạo báo cáo mới cho ngày ' + date };
    }

    return new Response(
      JSON.stringify({ message: result.message, success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/xin-ads:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
