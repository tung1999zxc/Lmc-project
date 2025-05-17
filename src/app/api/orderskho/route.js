// src/app/api/orderskho/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "failed";

    let query = {};

    if (filter === "failed") {
      query = {
        $and: [
          { saleReport: "DONE" }, // điều kiện bắt buộc
          {
            $or: [
              { paymentStatus: { $ne: "ĐÃ THANH TOÁN" } },
              { deliveryStatus: { $ne: "GIAO THÀNH CÔNG" } }
            ]
          }
        ]
      };
    } else if (filter === "success") {
      query = {
        deliveryStatus: "GIAO THÀNH CÔNG",
        saleReport: "DONE" 
        
      };
      
    } else if (filter === "all") {
      query = {
        
        saleReport: "DONE" 
        
      };// filter === "all" thì query = {} mặc định

    const orders = await db.collection('orders').find(query).toArray();

    return new Response(
      JSON.stringify({ message: 'Lấy đơn hàng kho thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orderskho:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
