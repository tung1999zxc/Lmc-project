import { connectToDatabase } from '../../../../../app/lib/mongodb3.js';
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
            istickDONE: order.istickDONE,
            // Nếu đơn hàng được tích (istick === true) thì cập nhật shippingDate1 và deliveryStatus.
            // shippingDate1 được định dạng bao gồm giờ, phút, giây.
            ...(order.istickDONE 
              ? { 
                  shippingDate2: dayjs().format("YYYY-MM-DD HH:mm:ss"), 
                  deliveryStatus: "GIAO THÀNH CÔNG" 
                }
              : {shippingDate2: "", 
                deliveryStatus: ""})
          }
        }
      }
    }));

    // Sử dụng bulkWrite để cập nhật hàng loạt
    await db.collection('orders').bulkWrite(updates);

    return new Response(
      JSON.stringify({ message: "Đã cập nhật istick, shippingDate1 và deliveryStatus cho các đơn hàng thành công" }),
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