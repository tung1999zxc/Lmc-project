// src/app/api/orders2/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb2.js';

function getDateRangeFromPreset(preset) {
  const now = new Date();
  let start, end;

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'currentMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'twoMonthsAgo':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      break;
    case 'threeMonthsAgo':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return {
    $gte: start.toISOString().split('T')[0],
    $lte: end.toISOString().split('T')[0]
  };
}

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    const url = new URL(req.url);
    const selectedDate = url.searchParams.get('selectedDate');
    const selectedPreset = url.searchParams.get('selectedPreset');

    const query = {};
    // Ưu tiên preset
    if (selectedPreset && selectedPreset !== 'all') {
      const range = getDateRangeFromPreset(selectedPreset);
      if (range) query.orderDate = range;
    } else if (selectedDate) {
      query.orderDate = selectedDate;
    }

    const projection = {
      orderDate: 1,
      revenue: 1,
      profit: 1,
      mkt: 1,
      sale: 1,
      salexuly: 1,
      saleReport: 1,
      processStatus: 1,
      paymentStatus: 1,
      deliveryStatus: 1,
      salexacnhan: 1,
      employee_code_order: 1,
      stt: 1,
      _id: 0,
      createdAt:1
    };

    const orders = await db.collection('orders').find(query, { projection }).toArray();

    return new Response(
      JSON.stringify({ message: 'Lấy danh sách đơn hàng thành công', data: orders }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/orders2:", error);
    return new Response(JSON.stringify({ error: 'Lỗi server nội bộ' }), { status: 500 });
  }
}
