// /app/api/orders/mark-hoan/route.js
import { connectToDatabase } from "../../../../../app/lib/mongodb2.js";
import dayjs from "dayjs";

export async function POST(req) {
  try {
    const { sttList } = await req.json();
    const { db } = await connectToDatabase();

    const bulkOps = sttList.map((stt) => ({
      updateOne: {
        filter: { stt: Number(stt) },
        update: {
          $set: {
            shippingDate1: "",
            deliveryStatus: "HOÀN",
            saleReport: "HOÀN",
          },
        },
      },
    }));

    await db.collection("orders").bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({ message: "Đã đánh dấu HOÀN thành công" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi đánh dấu HOÀN:", error);
    return new Response(JSON.stringify({ error: "Lỗi server" }), {
      status: 500,
    });
  }
}
