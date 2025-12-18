import { connectToDatabase } from "../../../../lib/mongodb2";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Chỉ thêm status cho những sản phẩm CHƯA có trường này
    const result = await db.collection("products").updateMany(
      { status2: { $exists: false } },   // lọc sản phẩm chưa có trường status
      { $set: { status2: true } }        // thêm status = true
    );

    return new Response(
      JSON.stringify({
        message: "Đã thêm status=true cho sản phẩm cũ",
        modifiedCount: result.modifiedCount,
      }),
      { status2: 200 }
    );
  } catch (error) {
    console.error("Lỗi thêm status:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server" }),
      { status2: 500 }
    );
  }
}
