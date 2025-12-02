// src/app/api/orders/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const params = url.searchParams;

    const query = {};
    const andConditions = [];

    // --- Lọc theo ngày ---
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

    // --- Lọc theo trạng thái ---
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

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log("Query:", JSON.stringify(query, null, 2));

    const orders = await db.collection('orders').aggregate([
      // Lấy đơn có trackingCode để group
      {
        $match: {
          ...query,
          trackingCode: { $exists: true, $ne: "" }
        }
      },

      { $sort: { orderDate: -1 } }, // ưu tiên bản mới nhất

      {
        $group: {
          _id: "$trackingCode",
          doc: { $first: "$$ROOT" }
        }
      },

      { $replaceRoot: { newRoot: "$doc" } },

      // UNION: Thêm các đơn không có trackingCode
      {
        $unionWith: {
          coll: "orders",
          pipeline: [
            {
              $match: {
                ...query,
                $or: [
                  { trackingCode: { $exists: false } },
                  { trackingCode: "" },
                  { trackingCode: null }
                ]
              }
            }
          ]
        }
      }
    ]).toArray();

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
      JSON.stringify({ error: error.message || 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
