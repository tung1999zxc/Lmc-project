
import { connectToDatabase } from '../../../app/lib/mongodb.js';


/* ================== HÀM TẠO KHOẢNG THỜI GIAN ================== */
function getDateRangeByPeriod(period) {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;

    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;

    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;

    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;

    case 'twoMonthsAgo':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      break;

    default:
      return null;
  }

  return {
    $gte: start.toISOString().split('T')[0],
    $lte: end.toISOString().split('T')[0],
  };
}

/* ================== GET (CÓ LỌC THỜI GIAN) ================== */
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const period = url.searchParams.get('period');

    const query = {};

    if (period) {
      const range = getDateRangeByPeriod(period);
      if (range) query.date = range;
    }

    const records = await db
      .collection('recordsSale')
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return new Response(
      JSON.stringify({
        message: 'Lấy danh sách recordsSale thành công',
        data: records,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/recordsSale error:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

/* ================== POST (GIỮ NGUYÊN) ================== */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id,
      date,
      newMess,
      dailySales,
      totalRemarketing,
      employeeId,
      employeeName,
    } = body;

    if (!id || !date || !employeeId) {
      return new Response(
        JSON.stringify({ error: 'Thiếu dữ liệu bắt buộc' }),
        { status: 400 }
      );
    }

    const newRecord = {
      id,
      date, // YYYY-MM-DD
      newMess: Number(newMess) || 0,
      closedOrders: 0,
      dailySales: Number(dailySales) || 0,
      totalRemarketing: Number(totalRemarketing) || 0,
      ratio: 0,
      employeeId,
      employeeName,
      createdAt: new Date(),
    };

    const { db } = await connectToDatabase();
    await db.collection('recordsSale').insertOne(newRecord);

    return new Response(
      JSON.stringify({
        message: 'Thêm record sale thành công',
        data: newRecord,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/recordsSale error:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
