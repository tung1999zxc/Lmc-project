// src/app/api/employees/[employee_id]/route.js
import { connectToDatabase } from '../../../lib/mongodb.js';
import bcrypt from 'bcryptjs';

/**
 * API cập nhật thông tin nhân viên
 * Endpoint: PUT /api/employees/[employee_id]
 */
export async function PUT(request, context) {
  try {
    // Lấy employee_id từ URL
   const { employee_id } = await context.params;

    // Kết nối tới MongoDB và tạo bộ lọc dựa trên employee_id
    const { db } = await connectToDatabase();
    const filter = { employee_id: parseInt(employee_id, 10) };

    // Lấy dữ liệu cập nhật từ request body
    let data = await request.json();
    console.log("Updating employee with ID:", employee_id, "Data:", data);

    // Nếu có trường password, kiểm tra xem đã được băm chưa
    if (data.password) {
      // Tìm nhân viên hiện tại từ database
      const user = await db.collection("employees").findOne(filter);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Không tìm thấy nhân viên" }),
          { status: 404 }
        );
      }
      // Nếu password không bắt đầu bằng "$2a$" hoặc "$2b$", tức chưa được băm, thì băm nó
      if (!data.password.startsWith("$2a$") && !data.password.startsWith("$2b$")) {
        data.password = await bcrypt.hash(data.password, 10);
      }
    }

    // Loại bỏ các trường không được phép cập nhật
    delete data._id;
    delete data.employee_id;
    delete data.employee_code;
    delete data.createdAt;

    // Cập nhật thông tin nhân viên
    const result = await db.collection("employees").updateOne(filter, { $set: data });
    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy nhân viên" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Cập nhật nhân viên thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi trong PUT /api/employees/[employee_id]:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}

/**
 * API xóa nhân viên
 * Endpoint: DELETE /api/employees/[employee_id]
 */
export async function DELETE(request, { params }) {
  try {
    const { employee_id } = params;
    console.log("Deleting employee with ID:", employee_id);

    const { db } = await connectToDatabase();
    const filter = { employee_id: parseInt(employee_id, 10) };

    const result = await db.collection("employees").deleteOne(filter);
    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy nhân viên" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Xóa nhân viên thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi trong DELETE /api/employees/[employee_id]:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
