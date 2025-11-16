// src/app/api/employees/route.js

import { connectToDatabase } from "../../../app/lib/mongodb.js";
import bcrypt from "bcryptjs";

/**
 * Tạo nhân viên mới
 * Endpoint: POST /api/employees
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,
      password,
      name,
      position,
      team_id,
      position_team,
      position_team2,
      status,
      quocgia,
      khuvuc,
    } = body;

    // Kiểm tra các trường bắt buộc
    if (!username || !password || !name || !position) {
      return new Response(
        JSON.stringify({ error: "Thiếu thông tin bắt buộc" }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Kiểm tra xem username đã tồn tại chưa
    const existingEmployee = await db
      .collection("employees")
      .findOne({ username });
    if (existingEmployee) {
      return new Response(JSON.stringify({ error: "Tài khoản đã tồn tại" }), {
        status: 400,
      });
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
      status,
      quocgia,
      khuvuc,
      team_id: team_id || null,
      position_team: position_team || null,
      position_team2: position_team2 || null,
      createdAt: new Date(),
    };

    await db.collection("employees").insertOne(newEmployee);

    return new Response(
      JSON.stringify({
        message: "Đăng ký thành công",
        data: newEmployee,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi trong POST /api/employees:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

/**
 * Lấy danh sách nhân viên
 * Endpoint: GET /api/employees
 */

export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();

    // Mã hóa mật khẩu "1"
    const hashedPassword = await bcrypt.hash("1", 10);

    // Cập nhật tất cả nhân viên có position_team = "sale"
    const result = await db
      .collection("employees")
      .updateMany(
        { position_team: "sale" },
        { $set: { password: hashedPassword } }
      );

    return new Response(
      JSON.stringify({
        message: `Đã reset ${result.modifiedCount} tài khoản sale về mật khẩu '1'`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi trong PUT /api/employees/reset-sale-passwords:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();

    // Lấy danh sách nhân viên từ collection "employees"
    const employees = await db.collection("employees").find({}).toArray();

    return new Response(
      JSON.stringify({
        message: "Danh sách nhân viên",
        data: employees,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi trong GET /api/employees:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

export async function PATCH(req) {
  try {
    const { db } = await connectToDatabase();
    
    // Cập nhật trường khuvuc = 'pvd' cho TẤT CẢ document trong collection "employees"
    const result = await db
      .collection("employees")
      .updateMany(
        {}, // Bộ lọc rỗng áp dụng cho tất cả
        { $set: { khuvuc: "pvd" } } // Đặt khuvuc = 'pvd'
      );

    return new Response(
      JSON.stringify({
        message: `Đã cập nhật ${result.modifiedCount} nhân viên về khu vực 'Phạm Văn Đồng'`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi trong PATCH /api/employees:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}