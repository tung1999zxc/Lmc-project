// src/app/api/pageName/deleteByEmployee/route.js
import { connectToDatabase } from "../../../lib/mongodb";

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const employee = url.searchParams.get("employee");

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Thiếu employee cần xoá" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Xoá toàn bộ page theo tên nhân viên
    const result = await db.collection("pageName").deleteMany({
      employee: employee,
    });

    return new Response(
      JSON.stringify({
        message: `Đã xoá toàn bộ page của nhân viên: ${employee}`,
        deletedCount: result.deletedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/pageName/deleteByEmployee:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
