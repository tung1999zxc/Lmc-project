// src/app/api/orders/search-by-customer/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const customerName = url.searchParams.get('name');

    if (!customerName || customerName.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Thiếu tên khách hàng' }),
        { status: 400 }
      );
    }

    const searchTerm = customerName.trim();
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Chuẩn hóa khoảng trắng: mỗi từ trong từ khóa được nối bằng \s+ để
    // "tung hk" khớp với "tung  hk", "tung   hk", "tung\thk" trong DB.
    const namePattern = searchTerm
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+');
    const exactNameRegex = new RegExp(`^\\s*${namePattern}\\s*$`, 'i');
    const exactTrackingRegex = new RegExp(`^${escapedSearchTerm}$`, 'i');
    const numericStt = Number(searchTerm);
    const query = {
      $or: [
        { customerName: { $regex: exactNameRegex } },
        ...(Number.isNaN(numericStt) ? [] : [{ stt: numericStt }]),
        { trackingCode: { $regex: exactTrackingRegex } },
      ],
    };

    const orders = await db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return new Response(
      JSON.stringify({ message: 'Tìm đơn theo tên khách thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi /api/orders/search-by-customer:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
