// src/app/api/orders/search-by-fb/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const fb = url.searchParams.get('fb');

    if (!fb || fb.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Thiếu link FB' }),
        { status: 400 }
      );
    }

    const searchTerm = fb.trim();
    // Escape các ký tự đặc biệt của regex
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // So khớp chính xác (case-insensitive) trên trường "fb"
    const exactFbRegex = new RegExp(`^${escapedSearchTerm}$`, 'i');

    const orders = await db
      .collection('orders')
      .find({ fb: { $regex: exactFbRegex } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return new Response(
      JSON.stringify({
        message: 'Tìm đơn theo link FB thành công',
        data: orders,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi /api/orders/search-by-fb:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}