import { connectToDatabase } from "../../../../app/lib/mongodb";

// POST /api/products/disable-stale
// Body: { days?: number }   // mặc định 90
// Tắt status = false cho tất cả sản phẩm có ngày đơn cuối > N ngày (so với hôm nay)
// Nếu sản phẩm chưa từng có đơn nào cũng sẽ bị tắt.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const days = Number(body?.days) > 0 ? Number(body.days) : 90;

    const { db } = await connectToDatabase();
    const orders = await db
      .collection("orders")
      .find({}, { projection: { _id: 0, products: 1, orderDate: 1 } })
      .toArray();

    // Tính ngày đơn cuối cho từng tên sản phẩm
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDateMap = new Map();
    for (const order of orders) {
      if (!order.orderDate) continue;
      const orderDate = new Date(order.orderDate);
      if (isNaN(orderDate.getTime())) continue;
      orderDate.setHours(0, 0, 0, 0);

      if (!Array.isArray(order.products)) continue;
      for (const item of order.products) {
        const name = String(item?.product || "").trim();
        if (!name) continue;
        const cur = lastDateMap.get(name);
        if (!cur || orderDate > cur) {
          lastDateMap.set(name, orderDate);
        }
      }
    }

    // Lấy tất cả sản phẩm
    const products = await db
      .collection("products")
      .find({}, { projection: { _id: 0, key: 1, name: 1, status: 1 } })
      .toArray();

    const keysToDisable = [];
    const skipped = [];
    for (const p of products) {
      if (p.status === false) {
        skipped.push({ key: p.key, name: p.name, reason: "Đã tắt trước đó" });
        continue;
      }
      const lastDate = lastDateMap.get(p.name);
      // Nếu không có đơn nào, coi như > N ngày
      const daysSince = lastDate
        ? Math.round((today - lastDate) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysSince >= days) {
        keysToDisable.push(p.key);
      } else {
        skipped.push({
          key: p.key,
          name: p.name,
          reason: `Chỉ ${daysSince} ngày`,
        });
      }
    }

    if (keysToDisable.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Không có sản phẩm nào đủ điều kiện để tắt",
          disabledCount: 0,
          skippedCount: skipped.length,
          skipped,
        }),
        { status: 200 }
      );
    }

    // Cập nhật hàng loạt: đổi status = false cho các key này
    const result = await db
      .collection("products")
      .updateMany(
        { key: { $in: keysToDisable.map((k) => Number(k)) } },
        { $set: { status: false, disabledAt: new Date() } }
      );

    return new Response(
      JSON.stringify({
        message: `Đã tắt ${result.modifiedCount} sản phẩm > ${days} ngày không có đơn`,
        disabledCount: result.modifiedCount,
        disabledKeys: keysToDisable,
        skippedCount: skipped.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi disable-stale:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}