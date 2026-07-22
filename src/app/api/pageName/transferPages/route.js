// src/app/api/pageName/transferPages/route.js
import { connectToDatabase } from "../../../lib/mongodb";

export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();

    // Danh sách nhân viên nguồn
    const sourceEmployees = [
      "Nguyễn Thị Ngọc Linh",
      
    ];

    // Nhân viên đích
    const targetEmployee = "Nguyễn Tuấn Anh";
   

    const result = await db.collection("pageName").updateMany(
      { employee: { $in: sourceEmployees } }, // điều kiện
      {
        $set: {
          employee: targetEmployee,
         
        },
      }
    );

    return new Response(
      JSON.stringify({
        message: "Đã chuyển toàn bộ page sang Trần Ngọc Diện",
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi /api/pageName/transferPages:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
