// src/app/api/employees/[employee_id]/route.js
import { connectToDatabase } from '../../../lib/mongodb.js';
import bcrypt from 'bcryptjs';

/**
 * API cập nhật thông tin nhân viên
 * Endpoint: PUT /api/employees/[employee_id]
 */
export async function PUT(request, { params }) {
  try {
    // Lấy employee_id từ URL (params)
    const { employee_id } = params;
    // Lấy dữ liệu cập nhật từ request body
    let data = await request.json();

    console.log('Updating employee with ID:', employee_id, 'Data:', data);

    // Nếu người dùng cung cấp mật khẩu mới thì mã hóa nó
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      // Nếu không cập nhật mật khẩu, loại bỏ key password để không ghi đè
      delete data.password;
    }

    // Loại bỏ các trường bất biến mà không được phép cập nhật
    delete data._id;
    delete data.employee_id;
    delete data.employee_code;
    delete data.createdAt;

    // Kết nối tới MongoDB
    const { db } = await connectToDatabase();

    // Chuyển employee_id thành số (vì employee_id được tạo bằng Date.now())
    const filter = { employee_id: parseInt(employee_id, 10) };

    // Cập nhật thông tin nhân viên theo employee_id
    const result = await db.collection('employees').updateOne(filter, { $set: data });
    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Cập nhật nhân viên thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong PUT /api/employees/[employee_id]:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
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
    // Lấy employee_id từ URL
    const { employee_id } = params;
    console.log('Deleting employee with ID:', employee_id);
    
    const { db } = await connectToDatabase();

    // Chuyển employee_id thành số
    const filter = { employee_id: parseInt(employee_id, 10) };

    const result = await db.collection('employees').deleteOne(filter);
    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Xóa nhân viên thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong DELETE /api/employees/[employee_id]:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
