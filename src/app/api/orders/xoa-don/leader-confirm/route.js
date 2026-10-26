import { connectToDatabase } from "../../../../lib/mongodb.js";

export async function POST(req) {
  try {
    const { orderId, lyDo, leaderName, xoaDonImages ,saleReport2} = await req.json();
    const { db } = await connectToDatabase();

    // Lấy order hiện tại để giữ nguyên người xin xóa ban đầu
    const existingOrder = await db
      .collection("orders")
      .findOne({ id: orderId });
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy đơn hàng" }),
        { status: 404 },
      );
    }

    // Bắt buộc phải có ít nhất 1 ảnh chứng minh
    if (
      !xoaDonImages ||
      !Array.isArray(xoaDonImages) ||
      xoaDonImages.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Vui lòng tải lên ít nhất 1 ảnh chứng minh" }),
        { status: 400 },
      );
    }

    const update = {
      $set: {
        xoaDonLyDo: lyDo,
        xoaDonImages: xoaDonImages || [],
        xoaDonBy: leaderName,
        xoaDonAt: new Date(),
        // Giữ nguyên người xin xóa ban đầu (nếu chưa có thì lead là người ghi nhận)
        xoaDonRequestBy: existingOrder.xoaDonRequestBy || leaderName,
        xoaDonRequestAt:
          existingOrder.xoaDonRequestAt || existingOrder.xoaDonAt || new Date(),
        daXinXoaDon: true,
        leaderDaXacNhan: true,
        leaderXacNhanAt: new Date(),
        saleReport2: saleReport2,
      },
    };

    const result = await db.collection("orders").updateOne(
      { id: orderId },
      update,
    );

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy đơn hàng" }),
        { status: 404 },
      );
    }

    return new Response(
      JSON.stringify({ message: "Leader đã xác nhận yêu cầu xóa đơn" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/xoa-don/leader-confirm:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
