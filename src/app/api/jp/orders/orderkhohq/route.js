import { connectToDatabase } from '../../../../../app/lib/mongodb2.js';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const query = {
      saleReport: "DONE",
      orderDate: {
        $gte: "2026-06-01",
      },
    };

    const orders = await db.collection("orders").find(query).toArray();

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
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}