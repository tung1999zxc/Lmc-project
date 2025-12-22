// /app/api/orders/mark-done/route.js
import { connectToDatabase } from '../../../../lib/mongodb3.js';
import dayjs from 'dayjs';

export async function POST(req) {
  try {
    const { sttList } = await req.json();
    const { db } = await connectToDatabase();

    const bulkOps = sttList.map((stt) => ({
      updateOne: {
        filter: { stt: Number(stt) },
        update: {  $set: {
          
          deliveryStatus: "ĐÃ GỬI HÀNG",
          shippingDate1: dayjs().format("YYYY-MM-DD"), 

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