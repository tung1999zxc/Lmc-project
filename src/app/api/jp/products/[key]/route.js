// src/app/api/products/[key]/route.js
import { connectToDatabase } from "../../../../../app/lib/mongodb2.js";

export async function PUT(request, { params }) {
  try {
    const { key } = await params;
    let data = await request.json();

    const updateFields = { ...data };
    delete updateFields._id;
    delete updateFields.key;
    delete updateFields.createdAt;

    const { db } = await connectToDatabase();
    const filter = { key: parseInt(key, 10) };

    // 🔹 Lấy sản phẩm cũ ra để so sánh
    const oldProduct = await db.collection("products").findOne(filter);
    if (!oldProduct) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
        { status: 404 }
      );
    }

    let updateDoc = { $set: updateFields };
    const pushOps = {};

    // 🔹 So sánh sltq
    if (
      data.sltq !== undefined &&
      data.sltq !== oldProduct.sltq
    ) {
      pushOps.sltqHistory = {
        qty: data.sltq,
        date: new Date().toISOString().split("T")[0],
      };
    }

    // 🔹 So sánh slvn
    if (
      data.slvn !== undefined &&
      data.slvn !== oldProduct.slvn
    ) {
      pushOps.slvnHistory = {
        qty: data.slvn,
        date: new Date().toISOString().split("T")[0],
      };
    }

    if (Object.keys(pushOps).length > 0) {
      updateDoc.$push = pushOps;
    }

    const result = await db.collection("products").updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Cập nhật sản phẩm thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PUT /api/products/[key]:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { key } = await params;
    const { db } = await connectToDatabase();
    const filter = { key: parseInt(key, 10) };

    const result = await db.collection("products").deleteOne(filter);
    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Xóa sản phẩm thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/products/[key]:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
