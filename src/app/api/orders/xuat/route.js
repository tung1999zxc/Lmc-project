// src/app/api/orders/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const params = url.searchParams;

    // Danh sách STT cần loại bỏ
    const excludeSTT = [
      32561, 32660, 32829, 32978, 33024, 33097, 33188,
      33608, 33976, 33979, 34280, 34434, 34760,
      34790, 34959, 42550, 99999
    ];

    const query = {};
    const andConditions = [];

    // --- Lọc theo ngày ---
    const startDate = params.get("startDate");
    const endDate = params.get("endDate");

    if (startDate && endDate) {
      andConditions.push({
        orderDate: {
          $exists: true,
          $ne: null,
          $gte: startDate,
          $lte: endDate,
        },
      });
    }

    // --- Lọc theo trạng thái ---
    const filter = params.get("filter");
    if (filter === "failed") {
      andConditions.push({
        $or: [
          { paymentStatus: { $ne: "ĐÃ THANH TOÁN" } },
          { deliveryStatus: { $ne: "GIAO THÀNH CÔNG" } },
        ],
      });
    } else if (filter === "success") {
      andConditions.push({
        paymentStatus: "ĐÃ THANH TOÁN",
        deliveryStatus: "GIAO THÀNH CÔNG",
      });
    }

    // --- Loại bỏ các đơn theo STT ---
    andConditions.push({
      stt: { $nin: excludeSTT }
    });

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log("Query:", JSON.stringify(query, null, 2));

    const orders = await db.collection("orders").aggregate([
      // Lấy các đơn có trackingCode hợp lệ để group
      {
        $match: {
          ...query,
          trackingCode: { $exists: true, $ne: "" },
        },
      },

      // Group để lấy đơn mới nhất theo trackingCode
      { $sort: { orderDate: -1 } },

      {
        $group: {
          _id: "$trackingCode",
          doc: { $first: "$$ROOT" },
        },
      },

      { $replaceRoot: { newRoot: "$doc" } },

      // UNION → thêm đơn không có trackingCode
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
                  { trackingCode: null },
                ],
              },
            },
          ],
        },
      },

      // --- Sắp xếp theo STT tăng dần ---
      { $sort: { stt: 1 } }
    ]).toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách đơn hàng thành công",
        data: orders,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
