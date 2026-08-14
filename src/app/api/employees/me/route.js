// src/app/api/employees/me/route.js
// Lấy thông tin nhân viên theo username (dùng để refresh currentUser khi admin đổi team)
import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Thiếu username" }),
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const employee = await db.collection("employees").findOne({ username });

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy nhân viên" }),
        { status: 404 },
      );
    }

    const { password: _, ...safeEmployee } = employee;
    safeEmployee.quocgia = safeEmployee.quocgia || "kr";

    return new Response(
      JSON.stringify({
        message: "Lấy thông tin nhân viên thành công",
        data: safeEmployee,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi GET /api/employees/me:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 },
    );
  }
}