// src/app/api/recordsMKT/quick-ads/route.js
import { connectToDatabase } from '../../../lib/mongodb.js';

export async function POST(req) {
  try {
    const { userId, name, sang, chieu, teamnv, stk, nh } = await req.json();

    if (!userId || !name) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin user' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Tìm báo cáo hôm nay của user
    const existingRecord = await db.collection("recordsMKT").findOne({
      userId: parseInt(userId),
      date: today
    });

    let result;

    if (existingRecord) {
      // Cộng thêm vào báo cáo hiện tại
      const updateData = {};
      if (sang) updateData.request1 = (existingRecord.request1 || 0) + parseInt(sang);
      if (chieu) updateData.request2 = (existingRecord.request2 || 0) + parseInt(chieu);
      
      await db.collection("recordsMKT").updateOne(
        { _id: existingRecord._id },
        { $set: updateData }
      );
      result = { message: 'Đã cộng thêm vào báo cáo hôm nay', updated: true };
    } else {
      // Tạo báo cáo mới
      const newRecord = {
        id: Date.now(),
        date: today,
        oldMoney: 0,
        request1: sang ? parseInt(sang) : 0,
        request2: chieu ? parseInt(chieu) : 0,
        excessMoney: 0,
        totalReceived: 0,
        tiendu: 0,
        teamnv: teamnv || '',
        adsMoney: (sang ? parseInt(sang) : 0) + (chieu ? parseInt(chieu) : 0),
        adsMoney2: 0,
        stk: stk || '',
        nh: nh || '',
        name,
        userId: parseInt(userId),
        isLocked: false,
        createdAt: new Date()
      };

      await db.collection("recordsMKT").insertOne(newRecord);
      result = { message: 'Đã tạo báo cáo mới cho hôm nay', created: true };
    }

    return new Response(
      JSON.stringify({ message: result.message, success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/recordsMKT/quick-ads:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
