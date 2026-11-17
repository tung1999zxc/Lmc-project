// src/app/lib/xoaDonNotify.mjs
// Helper: tạo thông báo cho các nhân viên liên quan khi xin / xác nhận / từ chối xóa đơn.

const clean = (v) => (v || "").trim();

/**
 * Gom danh sách nhân viên liên quan tới đơn (MKT / SALE / SALE XỬ LÝ).
 * Loại bỏ tên rỗng, loại trùng lặp (không phân biệt hoa thường) và loại chính người xử lý.
 */
export function collectRelatedEmployees(order, excludeName = "") {
  if (!order) return [];

  const fields = ["mkt", "sale", "salexuly", "xoaDonRequestBy"];
  const exclude = clean(excludeName).toLowerCase();
  const seen = new Set();
  const result = [];

  for (const field of fields) {
    const raw = order[field];
    if (!raw) continue;

    // Hỗ trợ trường lưu dạng mảng hoặc chuỗi phân tách bởi dấu phẩy
    const values = Array.isArray(raw)
      ? raw
      : String(raw)
          .split(",")
          .map((s) => s.trim());

    for (const value of values) {
      const name = clean(value);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      if (exclude && key === exclude) continue;
      seen.add(key);
      result.push(name);
    }
  }

  return result;
}

/**
 * Lấy danh sách Lead SALE / Manager SALE trong hệ thống (để báo duyệt xóa đơn).
 * Khớp không phân biệt hoa thường vì dữ liệu có cả "leadSALE"/"leadsale", "managerSALE"/"managersale".
 */
export async function getApproverEmployees(db) {
  if (!db) return [];
  try {
    const employees = await db
      .collection("employees")
      .find({
        position: { $in: [/^leadsale$/i, /^managersale$/i] },
      })
      .toArray();
    const seen = new Set();
    const result = [];
    for (const emp of employees) {
      const name = clean(emp?.name);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(name);
    }
    return result;
  } catch (error) {
    console.error("Lỗi lấy danh sách Lead/Manager SALE:", error);
    return [];
  }
}

/**
 * Gộp danh sách người nhận, loại trùng lặp (không phân biệt hoa thường).
 */
export function mergeRecipients(...lists) {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    for (const item of list || []) {
      const name = clean(item);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(name);
    }
  }
  return result;
}

/**
 * Tạo thông báo trong collection "notifications" cho các nhân viên liên quan.
 *
 * @param {import("mongodb").Db} db
 * @param {object} order        - document đơn hàng hiện tại
 * @param {string} actorName    - người thực hiện (người gửi yêu cầu / Manager SALE)
 * @param {string[]} recipients - danh sách tên nhận (đã lọc)
 * @param {string} content      - nội dung thông báo
 * @param {object} extra        - thông tin bổ sung (đơn vị, doanh số...)
 */
export async function createXoaDonNotification({
  db,
  order,
  actorName,
  recipients,
  content,
  extra = {},
}) {
  if (!db || !recipients || recipients.length === 0) return null;

  const stt = order?.stt ?? order?.id ?? "";
  const orderDate = order?.orderDate ?? "";
  const products = Array.isArray(order?.products)
    ? order.products
        .map((p) => p?.product)
        .filter(Boolean)
        .join(", ")
    : "";

  const notification = {
    message: content,
    author: actorName,
    department: null,
    recipients,
    type: "normal",
    createdAt: new Date(),
    confirmed: [],
    readBy: [], // Danh sách người đã đánh dấu đã đọc (dùng cho thông báo xóa đơn)
    // Chi tiết bổ sung (dùng cho hiển thị / tra cứu sau này)
    xoaDon: {
      orderId: order?.id ?? null,
      stt,
      orderDate,
      products,
      ...extra,
    },
  };

  const result = await db.collection("notifications").insertOne(notification);
  return { ...notification, _id: result.insertedId };
}
