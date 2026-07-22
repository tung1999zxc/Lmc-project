import { connectToDatabase } from '../../../../../app/lib/mongodb2.js';

const SALE_POSITIONS = new Set([
  'leadsale',
  'managersale',
  'salefull',
  'salexuly',
  'salenhapdon',
]);

export async function POST(req) {
  try {
    const {
      orderId,
      trackingCode = '',
      shippingDate1 = '',
      deliveryStatus = '',
      noteKHO = '',
      updatedBy = 'Unknown',
      position = '',
    } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Thiếu mã đơn hàng' }, { status: 400 });
    }

    const normalizedPosition = String(position).toLowerCase();
    if (!SALE_POSITIONS.has(normalizedPosition)) {
      return Response.json({ error: 'Bạn không có quyền Done đơn nhanh' }, { status: 403 });
    }

    const orderIdNumber = Number(orderId);
    const idFilters = [{ id: orderId }, { id: String(orderId) }];
    if (Number.isFinite(orderIdNumber)) idFilters.push({ id: orderIdNumber });

    const { db } = await connectToDatabase();
    const filter = { $or: idFilters };
    const order = await db.collection('orders').findOne(filter);

    if (!order) {
      return Response.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (order.saleReport === 'DONE') {
      return Response.json({ error: 'Đơn hàng này đã được Done trước đó' }, { status: 409 });
    }

    const updateData = {
      saleReport: 'DONE',
      orderDate6: new Date().toISOString(),
      trackingCode: String(trackingCode).trim(),
      shippingDate1: String(shippingDate1).trim(),
      deliveryStatus: String(deliveryStatus).trim(),
      noteKHO: String(noteKHO).trim(),
    };

    if (
      !order.salexuly &&
      ['salefull', 'salexuly'].includes(normalizedPosition) &&
      updatedBy
    ) {
      updateData.salexuly = String(updatedBy).trim();
    }

    await db.collection('orders').updateOne(filter, { $set: updateData });
    await db.collection('orderHistory').insertOne({
      ...updateData,
      id: order.id,
      stt: order.stt,
      backupBy: String(updatedBy || 'Unknown'),
      backupAt: new Date(),
      action: 'quick-done',
    });

    return Response.json({ message: `Đã Done đơn #${order.stt} thành công!` });
  } catch (error) {
    console.error('Lỗi POST /api/jp/orders/quick-done:', error);
    return Response.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
