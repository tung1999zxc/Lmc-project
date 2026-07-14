import { connectToDatabase } from '../../../../app/lib/mongodb.js';
import dayjs from 'dayjs';

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    // Tạo danh sách các thao tác update cho từng đơn hàng
    const updates = orders.map(order => ({
      updateOne: {
        filter: { id: order.id },
        update: { 
          $set: { 
            daXuLy: order.daXuLy,
            daXuLyDate: order.daXuLy ? dayjs().format("YYYY-MM-DD HH:mm:ss") : null,
            // Nếu hủy tick (daXuLy = false) thì xóa ngày
          }
        }
      }
    }));

    // Sử dụng bulkWrite để cập nhật hàng loạt
    await db.collection('orders').bulkWrite(updates);

    return new Response(
      JSON.stringify({ message: "Đã cập nhật trạng thái đã xử lý cho các đơn hàng thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/mark-da-xu-ly:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
