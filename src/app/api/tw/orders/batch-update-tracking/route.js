import { connectToDatabase } from '../../../../../app/lib/mongodb3.js';
import dayjs from "dayjs";

export async function POST(req) {
  try {
    const { updates } = await req.json();
    const { db } = await connectToDatabase();

    if (!Array.isArray(updates)) {
      return new Response(
        JSON.stringify({ error: "Dữ liệu không hợp lệ" }),
        { status: 400 }
      );
    }

    const today = dayjs().format("YYYY-MM-DD");

    const bulkOps = updates.map(({ stt, trackingCode }) => ({
      updateOne: {
        filter: { stt: Number(stt) },
        update: {
          $set: {
            trackingCode,
            shippingDate1: today,
            deliveryStatus: "ĐÃ GỬI HÀNG",
          },
        },
      },
    }));

    const result = await db.collection("orders").bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Đã cập nhật tracking + ngày gửi + trạng thái",
        result,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi batch update tracking:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
