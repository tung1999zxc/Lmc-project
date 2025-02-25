// src/app/api/register/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, password, name } = await req.json();

    // Kiểm tra các trường bắt buộc
    if (!username || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Tài khoản đã tồn tại' }),
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      name,
      createdAt: new Date()
    };

    await db.collection('users').insertOne(newUser);

    return new Response(
      JSON.stringify({ message: 'Đăng ký thành công', data: newUser }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi trong POST /api/register:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

/**
 * API lấy danh sách người dùng
 * Endpoint: GET /api/register
 */
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Lấy tất cả người dùng từ collection 'users'
    const users = await db.collection('users').find({}).toArray();

    return new Response(
      JSON.stringify({
        message: 'Lấy danh sách người dùng thành công',
        data: users
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong GET /api/register:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
  