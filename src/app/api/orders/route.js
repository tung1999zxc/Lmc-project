// src/app/api/orders/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    // Lấy tất cả đơn hàng từ collection "orders"
    const orders = await db.collection('orders').find({}).toArray();
    return new Response(
      JSON.stringify({ message: 'Lấy danh sách đơn hàng thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const {
      orderDate4,
      id,
      stt,
      orderDate,
      revenue,
      profit,
      customerName,
      pageName,
      category,
      products,
      mass,
      mkt,
      sale,
      salexuly,
      phone,
      address,
      note,
      noteKHO,
      processStatus,
      saleReport,
      paymentStatus,
      deliveryStatus,
      trackingCode,
      shippingDate1,
      shippingDate2,
      employee_code_order,
      istick,
      fb,
      salexacnhan,
      isShipping,
      // Các trường khác nếu cần
    } = await req.json();

    // Kiểm tra các trường bắt buộc (bạn có thể mở rộng kiểm tra nếu cần)
    if (!id || !orderDate) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc (id hoặc orderDate)' }),
        { status: 400 }
      );
    }

    const newOrder = {
      id, // id là định danh duy nhất (kiểu số hoặc string, ở đây bạn dùng string từ Date.now().toString())
      stt,
      orderDate, // "YYYY-MM-DD"
      revenue,
      profit,
      customerName,
      pageName,
      category,
      products,
      mass,
      mkt,
      sale,
      salexuly,
      salexacnhan,
      fb,
      phone,
      address,
      note,
      noteKHO,
      processStatus,
      saleReport,
      paymentStatus,
      deliveryStatus,
      trackingCode,
      shippingDate1,
      shippingDate2,
      employee_code_order,
      istick,
      orderDate4,
      isShipping,
      createdAt: new Date(),
    };

    const { db } = await connectToDatabase();
    await db.collection('orders').insertOne(newOrder);

    return new Response(
      JSON.stringify({ message: 'Thêm mới đơn hàng thành công', data: newOrder }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
