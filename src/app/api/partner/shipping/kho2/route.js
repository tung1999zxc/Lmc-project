import { connectToDatabase } from "../../../../lib/mongodb.js";

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    const isShippingName = "KHOVN2";

    const query = {
      isShippingName,
    };

    const orders = await db
      .collection("orders")
      .find(query)
      .project({
        _id: 0, // Không trả về ObjectId của MongoDB
        id: 1,
        stt: 1,
        orderDate: 1,
        shippingDate1: 1,
        shippingDate2: 1,
        customerName: 1,
        istickHistory: 1,
        products: 1,
        phone: 1,
        address: 1,
        category: 1,
        trackingCode: 1,
        deliveryStatus: 1,
        // note: 0,
      })
      .toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách đơn hàng thành công",
        data: orders,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ error: "Lỗi server" }), {
      status: 500,
    });
  }
}
