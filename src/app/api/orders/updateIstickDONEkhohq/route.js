import { connectToDatabase } from "../../../../app/lib/mongodb.js";
import dayjs from "dayjs";

export async function POST(req) {
  try {
    const { orders } = await req.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: "Không có đơn hàng để cập nhật" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updates = orders.map((order) => ({
      updateOne: {
        filter: { id: Number(order.id) },
        update: {
          $set: {
            istickDONE: order.istickDONE,

            ...(order.istickDONE
              ? {
                  shippingDate2: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                  deliveryStatus: "GIAO THÀNH CÔNG",
                }
              : {
                  shippingDate2: "",
                  deliveryStatus: "ĐÃ GỬI HÀNG",
                  istickDONE: false,
                }),
          },
        },
      },
    }));

    const result = await db.collection("orders").bulkWrite(updates);

    return new Response(
      JSON.stringify({
        message: "Đã cập nhật giao thành công",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstickDONE:", error);

    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}