// src/app/api/register/[username]/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';
import bcrypt from 'bcryptjs';

/**
 * API cập nhật thông tin người dùng (update)
 * Endpoint: PUT /api/register/[username]
 */
export async function PUT(request, { params }) {
  try {
    // Lấy username từ URL (params)
    const { username } = await params;
    // Lấy dữ liệu cập nhật từ request body
    const data = await request.json();

    console.log('Updating user with username:', username, 'Data:', data);

    // Nếu người dùng cung cấp mật khẩu mới thì mã hóa nó
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      // Nếu không cập nhật mật khẩu, loại bỏ key password để không ghi đè
      delete data.password;
    }

    const { db } = await connectToDatabase();

    // Cập nhật thông tin người dùng theo username
    const result = await db
      .collection('users')
      .updateOne({ username }, { $set: data });

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy người dùng' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Cập nhật người dùng thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong PUT /api/register/[username]:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

/**
 * API xóa người dùng
 * Endpoint: DELETE /api/register/[username]
 */
export async function DELETE(request, { params }) {
  try {
    // Lấy username từ URL
    const { username } = await params;
    console.log('Deleting user with username:', username);

    const { db } = await connectToDatabase();

    const result = await db.collection('users').deleteOne({ username });
    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy người dùng' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Xóa người dùng thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi trong DELETE /api/register/[username]:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
