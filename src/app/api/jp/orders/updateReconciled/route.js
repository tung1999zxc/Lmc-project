import { connectToDatabase } from '../../../../../app/lib/mongodb2.js';

import { ObjectId } from "mongodb";
import dayjs from "dayjs";

export async function POST(req) {
  try {
    const { orders } = await req.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      return Response.json(
        { error: "Không có đơn hàng để cập nhật" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updates = orders.map((order) => {
      // Tạo điều kiện filter đủ rộng: string id, number id, và _id ObjectId
      const orConditions = [
        { id: order.id },
        { id: Number(order.id) },
      ];
      // Nếu order.id là ObjectId hợp lệ, thêm match bằng _id
      try {
        orConditions.push({ _id: new ObjectId(order.id) });
      } catch (_) {
        // order.id không phải ObjectId string, bỏ qua
      }

      return {
        updateOne: {
          filter: { $or: orConditions },
          update: {
            $set: {
              reconciled: order.reconciled === true,
              reconciledDate: order.reconciled
                ? dayjs().format("YYYY-MM-DD HH:mm:ss")
                : "",
            },
          },
        },
      };
    });

    const result = await db.collection("orders").bulkWrite(updates);

    return Response.json({
      message: "Đã cập nhật đối soát",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateReconciled:", error);
    return Response.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}