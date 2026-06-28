import { connectToDatabase } from "../../../lib/mongodb.js";

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    const { searchParams } = new URL(req.url);

    const isShippingName = searchParams.get("isShippingName");

    const query = {
      isShippingName,
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
    console.error(error);

    return new Response(
      JSON.stringify({ error: "Lỗi server" }),
      { status: 500 }
    );
  }
}