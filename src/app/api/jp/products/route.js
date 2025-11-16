// src/app/api/products/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb2.js";

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    // Lấy toàn bộ sản phẩm, loại bỏ trường image cho nhẹ
    const products = await db
      .collection("products")
      .find({}, { projection: { image: 0 } })
      .toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách sản phẩm thành công",
        data: products,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/products:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const {
      name,
      image,
      description,
      importedQty = 0,
      importVN = 0,
      importKR = 0,
      slvn = 0,
      sltq = 0,
    } = await req.json();

    // Kiểm tra tên sản phẩm
    if (!name) {
      return new Response(
        JSON.stringify({ error: "Thiếu tên sản phẩm" }),
        { status: 400 }
      );
    }

    const newProduct = {
      key: Date.now(), // Dùng timestamp làm ID tạm
      name,
      image,
      description,
      slvn,
      sltq,
      imports: [
        {
          importedQty: Number(importedQty) || 0,
          importVN: Number(importVN) || 0,
          importKR: Number(importKR) || 0,
          importDate: new Date().toISOString().split("T")[0],
        },
      ],
      createdAt: new Date(),
    };

    const { db } = await connectToDatabase();
    await db.collection("products").insertOne(newProduct);

    return new Response(
      JSON.stringify({
        message: "Thêm sản phẩm thành công",
        data: newProduct,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/products:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
