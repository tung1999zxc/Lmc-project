// src/app/api/recordsSale/[id]/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb2.js';

export async function PUT(request, { params }) {
  try {
    // Chờ params được giải quyết và lấy id từ URL
    const { id } = await params;
    let data = await request.json();

    // Loại bỏ các trường bất biến không cho cập nhật
    delete data._id;
    delete data.id;
    delete data.createdAt;

    const { db } = await connectToDatabase();
    // Vì id được tạo bằng Date.now() nên chuyển từ chuỗi sang số
    const filter = { id: parseInt(id, 10) };

    const result = await db.collection('recordsSale').updateOne(filter, { $set: data });
    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy bản ghi' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Cập nhật thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PUT /api/recordsSale/[id]:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const filter = { id: parseInt(id, 10) };

    const result = await db.collection('recordsSale').deleteOne(filter);
    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy bản ghi' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Xóa thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/recordsSale/[id]:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
