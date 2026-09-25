// src/app/api/products/[key]/add-import/route.js
import { connectToDatabase } from "../../../../../app/lib/mongodb.js";

export async function POST(request, { params }) {
  try {
    const { key } = await params;
    const body = await request.json() || {};

    const { db } = await connectToDatabase();
    // key trong DB có thể là Number hoặc String ("...-8xz0"), thử cả 2
    const keyNum = Number(key);
    const filter = Number.isFinite(keyNum) && String(keyNum) === String(key)
      ? { $or: [{ key: keyNum }, { key }] }
      : { key };

    const product = await db.collection("products").findOne(filter);
    if (!product) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
        { status: 404 }
      );
    }

    // Build new import entry (only push if at least one value > 0)
    const importedQty = Number(body.importedQty) || 0;
    const importVN = Number(body.importVN) || 0;
    const importKR = Number(body.importKR) || 0;

    if (importedQty === 0 && importVN === 0 && importKR === 0) {
      return new Response(
        JSON.stringify({ error: "Không có giá trị nhập hợp lệ" }),
        { status: 400 }
      );
    }

    const importEntry = {
      importedQty,
      importVN,
      importKR,
      importDate:
        body.importDate || new Date().toISOString().split("T")[0],
    };

    await db.collection("products").updateOne(filter, {
      $push: { imports: importEntry },
    });

    return new Response(
      JSON.stringify({ message: "Đã thêm nhập hàng", entry: importEntry }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/products/[key]/add-import:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}