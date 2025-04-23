import { connectToDatabase } from '../../../../app/lib/mongodb.js';


export async function POST(req) {
  try {
    const { updates } = await req.json();
    const { db } = await connectToDatabase();

    if (!Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: "Dữ liệu không hợp lệ" }), { status: 400 });
    }

    const bulkOps = updates.map(({ stt, trackingCode }) => ({
      updateOne: {
        filter: { stt: Number(stt) },
        update: { $set: { trackingCode } },
      },
    }));

    const result = await db.collection("orders").bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({ message: "Đã cập nhật mã đơn hàng thành công", result }),
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
