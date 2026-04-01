// src/app/api/orders/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const params = url.searchParams;

    const query = {};
    const andConditions = [];

    // =============================
    // 1. LUÔN LỌC saleReport = DONE
    // =============================
    andConditions.push({
      saleReport: "DONE"
    });

    // =============================
    // 2. LỌC THEO NGÀY
    // =============================
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');

    if (startDate && endDate) {
      andConditions.push({
        orderDate: {
          $exists: true,
          $ne: null,
          $gte: startDate,
          $lte: endDate
        }
      });
    }

    // =============================
    // 3. LỌC THEO TRẠNG THÁI
    // =============================
    const filter = params.get('filter');

    if (filter === 'failed') {
      andConditions.push({
        $or: [
          { paymentStatus: { $ne: "ĐÃ THANH TOÁN" } },
          { deliveryStatus: { $ne: "GIAO THÀNH CÔNG" } }
        ]
      });
    } else if (filter === 'success') {
      andConditions.push({
        paymentStatus: "ĐÃ THANH TOÁN",
        deliveryStatus: "GIAO THÀNH CÔNG"
      });
    }

    // =============================
    // 4. GÁN QUERY
    // =============================
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log("Query:", JSON.stringify(query, null, 2));

    const orders = await db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 }) // mới nhất lên đầu
      .toArray();

    return new Response(
      JSON.stringify({
        message: 'Lấy danh sách đơn hàng thành công',
        data: orders
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}