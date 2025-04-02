import { connectToDatabase } from '../../../lib/mongodb.js';

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();
    const currentUserName = decodeURIComponent(req.headers.get('x-current-user')) || data.isShippingname || 'Unknown';
    // Tạo danh sách các thao tác update cho từng đơn hàng
    const updates = orders.map(order => ({
      updateOne: {
        filter: { id: order.id },
        update: { $set: { isShipping: order.isShipping , isShippingname: currentUserName } },
      }
    }));

    // Sử dụng bulkWrite để cập nhật hàng loạt
    await db.collection('orders').bulkWrite(updates);

    return new Response(
      JSON.stringify({ message: "Đã cập nhật istick cho các đơn hàng thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstick:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
