// src/app/api/employees/route.js

import { connectToDatabase } from '../../../app/lib/mongodb.js';
import bcrypt from 'bcryptjs';

/**
 * Tạo nhân viên mới
 * Endpoint: POST /api/employees
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, name, position, team_id, position_team, position_team2 } = body;

    // Kiểm tra các trường bắt buộc
    if (!username || !password || !name || !position) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Kiểm tra xem username đã tồn tại chưa
    const existingEmployee = await db.collection('employees').findOne({ username });
    if (existingEmployee) {
      return new Response(
        JSON.stringify({ error: 'Tài khoản đã tồn tại' }),
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo object nhân viên mới
    const newEmployee = {
      employee_id: Date.now(), // sử dụng timestamp làm ID
      employee_code: Math.floor(1000 + Math.random() * 9000),
      username,
      password: hashedPassword,
      name,
      position,
      team_id: team_id || null,
      position_team: position_team || null,
      position_team2: position_team2 || null,
      createdAt: new Date()
    };

    await db.collection('employees').insertOne(newEmployee);

    return new Response(
      JSON.stringify({
        message: 'Đăng ký thành công',
        data: newEmployee
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi trong POST /api/employees:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

/**
 * Lấy danh sách nhân viên
 * Endpoint: GET /api/employees
 */
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Lấy danh sách nhân viên từ collection "employees"
    const employees = await db.collection('employees').find({}).toArray();

    return new Response(
      JSON.stringify({
        message: 'Danh sách nhân viên',
        data: employees
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong GET /api/employees:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
