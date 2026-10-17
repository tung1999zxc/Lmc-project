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

// Hàm escape các ký tự đặc biệt của regex để tránh lỗi injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const escapedSearchTerm = escapeRegex(searchTerm);
const exactRegex = new RegExp(`^${escapedSearchTerm}$`, 'i');

// Tìm CHÍNH XÁC 100% (không phải LIKE / partial match):
// - Nếu nhập chữ: so khớp customerName bằng anchor ^...$ (case-insensitive)
// - Nếu nhập số: so khớp chính xác stt, đồng thời cũng exact-match customerName (trường hợp stt có thể trùng tên)
const query = isNaN(searchTerm)
  ? { customerName: exactRegex }
  : {
      $or: [
        { customerName: exactRegex },
        { stt: Number(searchTerm) }
      ]
    };

const orders = await db.collection('orderHistory').find(query).toArray();

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
