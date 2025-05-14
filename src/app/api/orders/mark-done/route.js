// /app/api/orders/mark-done/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';
import dayjs from 'dayjs';

export async function POST(req) {
  try {
    const { sttList } = await req.json();
    const { db } = await connectToDatabase();

    const bulkOps = sttList.map((stt) => ({
      updateOne: {
        filter: { stt: Number(stt) },
        update: {  $set: {
          istickDONE: true,
          deliveryStatus: "GIAO THÀNH CÔNG",
          shippingDate2: dayjs().format("YYYY-MM-DD"), 

        }, },
      },
    }));

    await db.collection("orders").bulkWrite(bulkOps);

    return new Response(JSON.stringify({ message: "Đã cập nhật istickDONE thành công" }), { status: 200 });
  } catch (error) {
    console.error("Lỗi cập nhật istickDONE:", error);
    return new Response(JSON.stringify({ error: "Lỗi server" }), { status: 500 });
  }
}