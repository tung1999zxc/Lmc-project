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

    // Build aggregation pipeline
    const pipeline = [
      // Nhóm 1: các đơn có trackingCode -> group (loại duplicate)
      {
        $match: {
          ...query,
          trackingCode: { $exists: true, $ne: "" }
        }
      },
      { $sort: { orderDate: -1 } }, // ưu tiên mới nhất
      {
        $group: {
          _id: "$trackingCode",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },

      // Gộp với nhóm 2: các đơn không có trackingCode (giữ nguyên)
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
      },

      // (Tùy chọn) sort một lần nữa kết quả đầu ra theo orderDate giảm dần
      { $sort: { orderDate: -1 } }
    ];

    // Thực hiện aggregation
    const cursor = db.collection('orders').aggregate(pipeline);
    const orders = await cursor.toArray();

    // Tránh trả payload quá lớn gây timeout/truncate trên client (nếu cần)
    // Nếu bạn muốn giới hạn: uncomment line bên dưới (ví dụ 5000)
    // const limitedOrders = orders.slice(0, 5000);

    return new Response(
      JSON.stringify({
        message: 'Lấy danh sách đơn hàng thành công',
        count: orders.length,
        data: orders
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );

  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);

    // Trả JSON rõ ràng để client không bị lỗi parse khi server bị crash
    const safe = {
      error: true,
      message: error.message || 'Lỗi server nội bộ',
      // stack có thể giúp debug — nếu production bạn có thể loại bỏ stack
      stack: error.stack ? String(error.stack).split('\n').slice(0, 10) : undefined
    };

    return new Response(JSON.stringify(safe), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}
