// src/app/api/products/bulk/route.js
import { connectToDatabase, ensureReady } from "../../../../app/lib/mongodb.js";

function splitCsv(input) {
  if (!input) return [];
  return String(input).split(",").map((s) => s.trim()).filter(Boolean);
}

// Giữ nguyên chuỗi user nhập (giống ProductAddForm)
function normalizeField(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ");
}

function buildNameCombos({ name, mau, size }) {
  const base = normalizeField(name);
  const maus = splitCsv(mau);
  const sizes = splitCsv(size);
  if (maus.length === 0 && sizes.length === 0) return base ? [base] : [];
  const mauList = maus.length > 0 ? maus : [""];
  const sizeList = sizes.length > 0 ? sizes : [""];
  const combos = [];
  for (const m of mauList) {
    for (const s of sizeList) {
      const parts = [base, normalizeField(m), normalizeField(s)].filter(Boolean);
      combos.push(parts.join(" - "));
    }
  }
  return combos;
}

async function insertFast(db, docs) {
  // Đảm bảo topology sẵn sàng trước khi insert
  await ensureReady(3000);
  const col = db.collection("products");

  try {
    const r = await col.insertMany(docs, { ordered: false });
    return { insertedCount: r.insertedCount, attempted: false };
  } catch (err) {
    const labels = err?.errorLabels;
    const isReset = labels && (labels.has?.("ResetPool") || labels.has?.("RetryableWriteError"));
    const partial = err?.result?.insertedCount || 0;

    if (!isReset) throw err;

    // Connection pool bị reset → tạo client mới + insert lại các docs chưa insert
    // (insertMany với _id đã có sẽ trùng → DupKey; ta loại _id đã insert nếu biết).
    // Đơn giản: build lại docs với _id mới cho phần chưa insert.
    const alreadyInsertedIds = new Set(Object.values(err.result?.insertedIds || {}).slice(0, partial));
    const remaining = docs.filter((d) => !alreadyInsertedIds.has(d._id));

    if (remaining.length === 0) {
      return { insertedCount: partial, attempted: true };
    }

    // Reconnect fresh client
    const c = await ensureReady(3000);
    const col2 = c.db().collection("products");
    const r2 = await col2.insertMany(remaining, { ordered: false });
    return { insertedCount: partial + r2.insertedCount, attempted: true };
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Dạng mới: client gửi sẵn mảng `docs` (đã build từ FE)
    // Có 2 kiểu đóng gói:
    //   1) body là array thuần:       [{...}, {...}]
    //   2) body là { docs: [...] }
    const incomingArray = Array.isArray(body)
      ? body
      : Array.isArray(body?.docs)
      ? body.docs
      : null;
    if (incomingArray && incomingArray.length > 0) {
      const { db } = await connectToDatabase();
      const { insertedCount } = await insertFast(db, incomingArray);
      return new Response(JSON.stringify({
        message: `Đã thêm ${insertedCount} sản phẩm`,
        insertedCount,
        data: incomingArray,
      }), { status: 201 });
    }

    // Dạng cũ: { name, mau, size, ... } — FE chỉ gửi input thô
    const {
      name, mau = "", size = "", image = null,
      description = "", weight = 0,
      importedQty = 0, importVN = 0, importKR = 0,
    } = body || {};

    if (!name || !String(name).trim()) {
      return new Response(JSON.stringify({ error: "Thiếu tên sản phẩm" }), { status: 400 });
    }

    const combos = buildNameCombos({ name, mau, size });
    if (combos.length === 0) {
      return new Response(JSON.stringify({ error: "Không tạo được tên sản phẩm nào" }), { status: 400 });
    }

    const importDate = new Date().toISOString().split("T")[0];
    const ts = Date.now();
    const docs = combos.map((fullName, i) => ({
      _id: undefined,
      key: `${ts}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: fullName,
      image,
      description,
      weight: Number(weight) || 0,
      slvn: 0,
      sltq: 0,
      status: true,
      imports: [{
        importedQty: Number(importedQty) || 0,
        importVN: Number(importVN) || 0,
        importKR: Number(importKR) || 0,
        importDate,
      }],
      createdAt: new Date(),
    }));

    const { db } = await connectToDatabase();
    const { insertedCount } = await insertFast(db, docs);

    return new Response(JSON.stringify({
      message: `Đã thêm ${insertedCount} sản phẩm`,
      insertedCount,
      data: docs,
    }), { status: 201 });
  } catch (error) {
    console.error("Lỗi POST /api/products/bulk:", error?.message || error);
    return new Response(JSON.stringify({
      error: "Lỗi server nội bộ",
      detail: error?.message,
    }), { status: 500 });
  }
}
