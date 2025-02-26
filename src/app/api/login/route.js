// src/app/api/login/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    
    // Kiểm tra xem người dùng đã nhập đủ thông tin chưa
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' }),
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Tìm nhân viên dựa theo username
    const employee = await db.collection('employees').findOne({ username });
    if (!employee) {
      return new Response(
        JSON.stringify({ error: 'Tài khoản không tồn tại' }),
        { status: 404 }
      );
    }
    
    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return new Response(
        JSON.stringify({ error: 'Mật khẩu không đúng' }),
        { status: 401 }
      );
    }
    
    // Loại bỏ trường mật khẩu trước khi trả về
    const { password: _, ...safeEmployee } = employee;
    
    return new Response(
      JSON.stringify({ message: 'Đăng nhập thành công', data: safeEmployee }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong POST /api/login:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
