import { connectToDatabase } from "../../../lib/mongodb.js";

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    if (!Array.isArray(orders) || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: "Không có đơn để cập nhật" }),
        { status: 400 },
      );
    }

    const bulkOps = orders.map((order) => ({
      updateOne: {
        filter: { stt: Number(order.stt) },
        update: [
          {
            $set: {
              deliveryStatus: {
                $cond: [
                  {
                    $in: ["$deliveryStatus", ["ĐÃ GỬI HÀNG", ""]],
                  },
                  "",
                  "ĐÃ GỬI HÀNG",
                ],
              },
              isShippingName: {
                $cond: [
                  {
                    $in: ["$deliveryStatus", ["ĐÃ GỬI HÀNG", ""]],
                  },
                  "",
                  order.isShippingName,
                ],
              },
              shippingDate1: {
                $cond: [
                  {
                    $in: ["$deliveryStatus", ["ĐÃ GỬI HÀNG", ""]],
                  },
                  "",
                  order.shippingDate1,
                ],
              },
              isShipping: {
                $cond: [
                  {
                    $in: ["$deliveryStatus", ["ĐÃ GỬI HÀNG", ""]],
                  },
                  false,
                  order.isShipping,
                ],
              },
              trackingCode: {
                $cond: [
                  {
                    $in: ["$deliveryStatus", ["ĐÃ GỬI HÀNG", ""]],
                  },
                  "",
                  order.trackingCode,
                ],
              },
            },
          },
        ],
      },
    }));

    const result = await db.collection("orders").bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Đã cập nhật trạng thái gửi hàng",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstick:", error);

    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
