// src/app/api/orders/nextStt/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb2.js';

export async function POST(req) {
  try {
    const { db } = await connectToDatabase();

    // Tăng giá trị counter một cách nguyên tử và trả về document sau khi update
    await db.collection("counters").updateOne(
      { _id: "orderCounter" },
      { $inc: { seq: 1 } },
      { upsert: true }
    );
    
    const updatedDoc = await db.collection("counters").findOne({ _id: "orderCounter" });
    const nextStt = updatedDoc && updatedDoc.seq !== undefined ? updatedDoc.seq : 1;

    return new Response(
      JSON.stringify({ nextStt }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lỗi trong POST /api/orders/nextStt:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
