// src/app/api/products/bulk-update/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb";

export async function PUT(req) {
  try {
    const body = await req.json();
    const { keys, mkttest, testday } = body;

    // validate
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return new Response(
        JSON.stringify({ error: "Thiếu danh sách sản phẩm" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateData = {};

    if (mkttest !== undefined) {
      updateData.mkttest = mkttest;
    }

    if (testday !== undefined) {
      updateData.testday = testday;
    }

    const result = await db.collection("products").updateMany(
      {
        key: { $in: keys.map((k) => Number(k)) },
      },
      {
        $set: updateData,
      }
    );

    return new Response(
      JSON.stringify({
        message: "Cập nhật hàng loạt thành công",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk update error:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}