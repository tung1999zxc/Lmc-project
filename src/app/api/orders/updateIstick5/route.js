import { connectToDatabase } from '../../../lib/mongodb.js';

export async function POST(req) {
  try {
    const { orders } = await req.json();
    const { db } = await connectToDatabase();

    // Validate phía server: nếu istick5 = true thì bắt buộc phải có istickLyDo
    for (const order of orders) {
      const lyDo = (order.istickLyDo || "").toString().trim();
      if (order.istick5 === true && lyDo.length === 0) {
        return new Response(
          JSON.stringify({
            error: `Đơn ${order.id}: Bắt buộc phải ghi lý do trước khi tích "Đơn cần xử lý"`,
          }),
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Xử lý từng đơn một để có thể đọc lịch sử cũ rồi append
    for (const order of orders) {
      const lyDoMoi = (order.istickLyDo || "").toString();

      // Đọc bản ghi hiện tại để lấy lịch sử cũ
      const currentDoc = await db
        .collection('orders')
        .findOne({ id: order.id }, { projection: { istickHistory: 1 } });
      const oldHistory = Array.isArray(currentDoc?.istickHistory)
        ? currentDoc.istickHistory
        : [];

      // Nếu lý do mới khác lý do cũ và khác rỗng → append vào lịch sử
      // (mỗi entry mới có timestamp + lý do)
      let newHistory = oldHistory;
      const oldLyDo = (currentDoc?.istickLyDo || "").toString();
      if (
        order.istick5 === true &&
        lyDoMoi.trim().length > 0 &&
        lyDoMoi !== oldLyDo
      ) {
        newHistory = [
          ...oldHistory,
          { at: nowIso, lyDo: lyDoMoi },
        ];
      }

      let update;
      if (order.istick5 === true) {
        // Tick = true: lưu lý do + ngày tích (timestamp ISO) + lịch sử
        update = {
          $set: {
            istick5: true,
            istickLyDo: lyDoMoi,
            istickDate: now,
            istickHistory: newHistory,
          },
        };
      } else {
        // Bỏ tick: reset lý do + ngày tích, giữ lại lịch sử
        update = {
          $set: {
            istick5: false,
            istickLyDo: '',
            istickDate: null,
            istickHistory: newHistory,
          },
        };
      }

      await db.collection('orders').updateOne({ id: order.id }, update);
    }

    return new Response(
      JSON.stringify({
        message:
          "Đã cập nhật trạng thái Đơn cần xử lý cho các đơn hàng thành công",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/orders/updateIstick5:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}