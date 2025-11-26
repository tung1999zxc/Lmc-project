import { connectToDatabase } from "../../../lib/mongodb";

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employee = searchParams.get("employee");

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Thiếu employee cần xoá" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Tạo regex xóa không cần chính xác hoàn toàn
    const regex = new RegExp(employee.replace(/\s+/g, "\\s+"), "i");

    const result = await db.collection("pageName").deleteMany({
      employee: { $regex: regex },
    });

    return new Response(
      JSON.stringify({
        message: `Đã xoá toàn bộ page có employee giống: ${employee}`,
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
