// src/app/api/personal-report/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

function getDateRangeFromPreset(preset) {
  const now = new Date();
  let start, end;

  switch (preset) {
    case 'day':
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
    case 'month':
    case 'currentMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'lastMonth':
    case 'prev':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'all':
      return null;
    default:
      return null;
  }

  return {
    $gte: start.toISOString().split('T')[0],
    $lte: end.toISOString().split('T')[0],
  };
}

const GH_DONE_KEYS = new Set(['done', 'đã done', 'da done', 'completed']);

function isDone(order) {
  if (!order) return false;
  const status = String(order.processStatus || '').toLowerCase().trim();
  if (status && GH_DONE_KEYS.has(status)) return true;
  const report = String(order.saleReport || '').toLowerCase().trim();
  if (report === 'done') return true;
  const delivery = String(order.deliveryStatus || '').toLowerCase().trim();
  if (delivery === 'đã nhận hàng' || delivery === 'da nhan hang') return true;
  return false;
}

function isPersonal(order, nameKey) {
  if (!nameKey) return false;
  const sale = String(order.sale || '').trim().toLowerCase();
  const xl = String(order.salexuly || '').trim().toLowerCase();
  return sale === nameKey || xl === nameKey;
}

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const preset = url.searchParams.get('preset') || 'currentMonth';
    const scope = url.searchParams.get('scope') || 'kr';

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Thiếu tên nhân viên (name)' }),
        { status: 400 }
      );
    }

    const nameKey = String(name).trim().toLowerCase();
    const collections = scope === 'all'
      ? ['orders', 'ordersJP', 'ordersTW']
      : scope === 'jp'
      ? ['ordersJP']
      : scope === 'tw'
      ? ['ordersTW']
      : ['orders'];

    const range = getDateRangeFromPreset(preset);
    const baseProjection = {
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
      stt: 1,
      _id: 0,
    };

    let allOrders = [];
    for (const col of collections) {
      const q = {};
      if (range) q.orderDate = range;
      q.$or = [
        { sale: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
        { salexuly: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
      ];
      try {
        const rows = await db.collection(col).find(q, { projection: baseProjection }).toArray();
        allOrders = allOrders.concat(rows);
      } catch (err) {
        // Bỏ qua collection không tồn tại để không chặn các nguồn khác
      }
    }

    const mine = allOrders.filter((o) => isPersonal(o, nameKey));
    const total = mine.length;
    const done = mine.filter(isDone).length;
    const notDone = total - done;
    const doneRate = total ? Math.round((done / total) * 1000) / 10 : 0;
    const totalDS = mine.reduce((s, r) => s + (Number(r.revenue) || Number(r.profit) || 0), 0);
    const totalProfit = mine.reduce((s, r) => s + (Number(r.profit) || 0), 0);

    const daTT = mine.filter((r) => String(r.paymentStatus || '').toLowerCase().includes('đã tt') || String(r.paymentStatus || '').toLowerCase().includes('da tt')).length;
    const chuaTT = total - daTT;

    const byDate = new Map();
    for (const r of mine) {
      const d = String(r.orderDate || '').slice(0, 10);
      if (!d) continue;
      if (!byDate.has(d)) byDate.set(d, { ngay: d, tong: 0, doanhSo: 0, daTT: 0 });
      const slot = byDate.get(d);
      slot.tong += 1;
      slot.doanhSo += Number(r.profit) || 0;
      const ps = String(r.paymentStatus || '').toLowerCase();
      if (ps.includes('đã tt') || ps.includes('da tt')) slot.daTT += 1;
    }
    const daily = Array.from(byDate.values())
      .sort((a, b) => (a.ngay < b.ngay ? 1 : -1))
      .map((d) => ({
        ngay: d.ngay,
        tong: d.tong,
        raDon: d.tong,
        ds: Math.round(d.doanhSo),
      }));

    return new Response(
      JSON.stringify({
        message: 'Lấy báo cáo cá nhân thành công',
        data: {
          name,
          preset,
          total,
          done,
          notDone,
          doneRate,
          totalDS,
          totalProfit,
          daTT,
          chuaTT,
          daily,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi GET /api/personal-report:', error);
    return new Response(JSON.stringify({ error: 'Lỗi server nội bộ' }), { status: 500 });
  }
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}