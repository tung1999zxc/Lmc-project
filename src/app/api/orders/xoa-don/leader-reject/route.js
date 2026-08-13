import { connectToDatabase } from "../../../../lib/mongodb.js";

export async function POST(req) {
  try {
    const { orderId, lyDo, leaderName } = await req.json();
    const { db } = await connectToDatabase();

    const update = {
      $set: {
        daXinXoaDon: true,
        leaderDaXacNhan: false,
        leaderTuChoi: true,
        leaderTuChoiAt: new Date(),
        leaderTuChoiBy: leaderName,
        xoaDonLyDo: lyDo,
        xoaDonBy: leaderName,
        xoaDonAt: new Date(),
      },
    };

    const result = await db
      .collection("orders")
      .updateOne({ id: orderId }, update);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy đơn hàng" }),
        { status: 404 },
      );
    }

    return new Response(
      JSON.stringify({ message: "Leader đã từ chối yêu cầu xóa đơn" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/xoa-don/leader-reject:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
