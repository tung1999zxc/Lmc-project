import { connectToDatabase } from "../../../lib/mongodb.js";

export async function POST(req) {
  try {
    const { orderId, lyDo, imageUrls, employeeName , saleReport2 } = await req.json();
    const { db } = await connectToDatabase();

    const update = {
      $set: {
        xoaDonLyDo: lyDo,
        xoaDonImages: imageUrls || [],
        xoaDonBy: employeeName,
        xoaDonAt: new Date(),
        daXinXoaDon: true,
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
      JSON.stringify({ message: "Đã lưu yêu cầu xóa đơn thành công" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/xoa-don:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
