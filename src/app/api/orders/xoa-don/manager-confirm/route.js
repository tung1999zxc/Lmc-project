import { connectToDatabase } from "../../../../lib/mongodb.js";

export async function POST(req) {
  try {
    const {
      orderId,
      lyDo,
      managerName,
      xoaDonImages,
      revenue,
      revenuemkt,
      profit,
      profitmkt,
      saleReport,
    } = await req.json();
    const { db } = await connectToDatabase();

    // Lấy order hiện tại để giữ nguyên sanPham và saleName
    const existingOrder = await db.collection("orders").findOne({ id: orderId });
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy đơn hàng" }),
        { status: 404 },
      );
    }

    const update = {
      $set: {
        xoaDonLyDo: lyDo,
        xoaDonImages: xoaDonImages || [],
        xoaDonBy: managerName,
        xoaDonAt: new Date(),
        daXinXoaDon: true,
        leaderDaXacNhan: true,
        leaderXacNhanAt: new Date(),
        managerDaXacNhan: true,
        managerXacNhanAt: new Date(),
        // Reset doanh số về 0
        revenue: 0,
        revenuemkt: 0,
        profit: 0,
        profitmkt: 0,
        saleReport: saleReport || null,
        // Giữ nguyên sanPham và saleName từ DB
       
        // Đánh dấu đơn đã bị xóa
        daXoaVinhVien: true,
        daXoaVinhVienAt: new Date(),
      },
      // Lưu lại thông tin doanh số bị xóa
      $push: {
        xoaDonHistory: {
          revenue,
          revenuemkt,
          profit,
          profitmkt,
         
          deletedBy: managerName,
          deletedAt: new Date(),
        },
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
      JSON.stringify({
        message: "Manager đã xác nhận xóa đơn. Doanh số đã được reset về 0",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/xoa-don/manager-confirm:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
