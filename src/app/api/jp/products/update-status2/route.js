import { connectToDatabase } from "../../../../lib/mongodb2";

export async function POST(req) {
  try {
    const { key, status2 } = await req.json();
    const { db } = await connectToDatabase();

    const result = await db.collection("products").updateOne(
      { key: Number(key) },
      { $set: { status2: status2 } }
    );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "Không tìm thấy sản phẩm" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Cập nhật trạng thái thành công" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Lỗi server" }), { status: 500 });
  }
}
