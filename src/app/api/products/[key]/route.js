// src/app/api/products/[key]/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function PUT(request, { params }) {
  try {
    // Chờ params được giải quyết
    const { key } = await params;
    let data = await request.json();

    const updateFields = { ...data };
    // Loại bỏ các trường không được phép cập nhật
    delete data._id;
    delete data.key;
    delete data.createdAt;

    const { db } = await connectToDatabase();
    // Vì key được tạo bằng Date.now() (kiểu số), chuyển từ chuỗi sang số
    const filter = { key: parseInt(key, 10) };
    let updateDoc = { $set: updateFields };
    if (data.sltq !== undefined) {
      updateDoc.$push = {
        sltqHistory: {
          qty: data.sltq,
          date: new Date().toISOString().split("T")[0],
        },
      };
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
