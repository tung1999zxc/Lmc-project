import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("orders").updateMany(
      { deliveryStatus: "ĐÃ Gửi Hàng" },
      { $set: { deliveryStatus: "ĐÃ GỬI HÀNG" } },
    );
    return new Response(
      JSON.stringify({
        message: "Đã chuẩn hóa deliveryStatus về 'ĐÃ GỬI HÀNG'",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(JSON.stringify({ error: "Lỗi server" }), {
      status: 500,
    });
  }
}