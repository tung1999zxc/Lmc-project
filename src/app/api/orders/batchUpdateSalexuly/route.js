// src/app/api/orders/batchUpdateSalexuly/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function POST(req) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('orders');

    // Tìm tất cả đơn có salexuly là "Đỗ Uyển Nhi"
    const orders = await collection.find({ salexuly: "Đỗ Uyển Nhi" }).toArray();

    const updates = orders.map(order => {
      const newName = (order.stt % 2 === 0)
        ? "Lê Linh Chi"
        : "Trần Thị Hồng Nhung";

      return {
        updateOne: {
          filter: { id: order.id },
          update: { $set: { salexuly: newName } }
        }
      };
    });

    // Nếu không có đơn nào thì return sớm
    if (updates.length === 0) {
      return new Response(JSON.stringify({ message: 'Không có đơn hàng cần cập nhật' }), {
        status: 200
      });
    }

    const result = await collection.bulkWrite(updates);
    return new Response(JSON.stringify({
      message: `Đã cập nhật thành công ${result.modifiedCount} đơn hàng`,
    }), {
      status: 200
    });
  } catch (error) {
    console.error("Lỗi cập nhật salexuly hàng loạt:", error);
    return new Response(JSON.stringify({ error: 'Lỗi server nội bộ' }), {
      status: 500
    });
  }
}
