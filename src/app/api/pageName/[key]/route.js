// src/app/api/pageName/[key]/route.js
// import { connectToDatabase } from '../../../../app/lib/mongodb.js';

// export async function PUT(request, { params }) {
//   try {
//     const { key } = await params;
//     let data = await request.json();

//     // Loại bỏ các trường không được phép cập nhật
//     delete data._id;
//     delete data.key;
//     delete data.createdAt;

//     const { db } = await connectToDatabase();
//     // Chuyển key thành số (vì key được tạo bằng Date.now())
//     const filter = { key: parseInt(key, 10) };

//     const result = await db.collection('pageName').updateOne(filter, { $set: data });
//     console.log('Update result:', result);

//     if (result.matchedCount === 0) {
//       return new Response(
//         JSON.stringify({ error: 'Không tìm thấy đơn hàng' }),
//         { status: 404 }
//       );
//     }

//     return new Response(
//       JSON.stringify({ message: 'Cập nhật đơn hàng thành công' }),
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error('Lỗi PUT /api/pageName/[key]:', error);
//     return new Response(
//       JSON.stringify({ error: 'Lỗi server nội bộ' }),
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(request, { params }) {
//   try {
//     const { key } = params;
//     const { db } = await connectToDatabase();
//     const filter = { key: parseInt(key, 10) };

//     const result = await db.collection('pageName').deleteOne(filter);
//     console.log('Delete result:', result);

//     if (result.deletedCount === 0) {
//       return new Response(
//         JSON.stringify({ error: 'Không tìm thấy đơn hàng' }),
//         { status: 404 }
//       );
//     }

//     return new Response(
//       JSON.stringify({ message: 'Xóa đơn hàng thành công' }),
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error('Lỗi DELETE /api/pageName/[key]:', error);
//     return new Response(
//       JSON.stringify({ error: 'Lỗi server nội bộ' }),
//       { status: 500 }
//     );
//   }
// }

// src/app/api/pageName/[key]/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function PUT(request, context) {
  try {
    const params = await context.params; // ✔️ UNWRAP PROMISE
    const { key } = params;

    let data = await request.json();

    // Xóa các field không được cập nhật
    delete data._id;
    delete data.key;
    delete data.createdAt;

    const { db } = await connectToDatabase();

    const filter = { key: Number(key) };

    const result = await db
      .collection("pageName")
      .updateOne(filter, { $set: data });

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "Không tìm thấy đơn hàng" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Cập nhật đơn hàng thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PUT /api/pageName/[key]:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params; // ✔️ FIX
    const { key } = params;

    const { db } = await connectToDatabase();

    const filter = { key: Number(key) };

    const result = await db.collection("pageName").deleteOne(filter);
    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "Không tìm thấy đơn hàng" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Xóa đơn hàng thành công" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/pageName/[key]:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
