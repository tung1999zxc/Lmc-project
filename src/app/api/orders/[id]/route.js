// src/app/api/orders/[id]/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function PUT(request, { params }) {
  try {
    // Chờ params được giải quyết và lấy id từ URL
    const { id } = await params;
    let data = await request.json();

    // Loại bỏ các trường bất biến không được cập nhật
    delete data._id;
    delete data.id;
    delete data.createdAt;
    delete data.istick;
    delete data.istick4;
    delete data.istickDONE;
    delete data.isShipping;
    const currentUser_kho = decodeURIComponent(request.headers.get('x-current-user')) || data.updatedBy || 'Unknown';
    const allowedForKhoOnly = ["shippingDate1", "shippingDate2", "trackingCode", "noteKHO", "deliveryStatus"];
const userName = request.headers.get('x-current-username');

if (currentUser_kho === "kho") {
  // Chỉ giữ lại các trường được phép
  Object.keys(data).forEach((key) => {
    if (!allowedForKhoOnly.includes(key)) {
      delete data[key];
    }
  });
} else {
  // Người khác thì không được cập nhật các trường của kho
  for (const field of allowedForKhoOnly) {
    delete data[field];
  }
}

    const { db } = await connectToDatabase();
    // Giả sử id được tạo bằng Date.now().toString(), so sánh trực tiếp
    const filter = { id };



    // Lấy tên người chỉnh sửa từ header (currentUser.name) hoặc data.updatedBy nếu có
    // const currentUserName = decodeURIComponent(request.headers.get('x-current-user')) || data.updatedBy || 'Unknown';
   
    // const exemptUsers = ['TK KHO', 'Nguyễn Diệp Anh', 'Trần Mỹ Hạnh'];

    // if (!exemptUsers.includes(currentUserName)   ){
    //       // Lấy đơn hàng cũ từ cơ sở dữ liệu
    // const oldOrder = await db.collection('orders').findOne(filter);
    // if (!oldOrder) {
    //   return new Response(
    //     JSON.stringify({ error: 'Không tìm thấy đơn hàng' }),
    //     { status: 404 }
    //   );
    // }
    // // So sánh dữ liệu cũ và mới để ghi nhận lịch sử chỉnh sửa
    // const changes = [];
    // Object.keys(data).forEach((key) => {
    //   // Bỏ qua các trường không cần so sánh
    //   if (['_id', 'id', 'createdAt'].includes(key)) return;
    //   if (oldOrder[key] !== data[key]) {
    //     changes.push({
    //       field: key,
    //       oldValue: oldOrder[key],
    //       newValue: data[key],
    //     });
    //   }
    // });

    // // Nếu có thay đổi, lưu lịch sử vào collection "orderHistory"
    // if (changes.length > 0) {
    //   await db.collection('orderHistory').insertOne({
    //     orderId: id,
    //     stt: oldOrder.stt, // Lưu luôn trường stt của đơn hàng
    //     editedBy: currentUserName,
    //     changes,
    //     timestamp: new Date(),
    //   });
    // }}    

    // Cập nhật đơn hàng với dữ liệu mới
    const result = await db.collection('orders').updateOne(filter, { $set: data });
    console.log("Update result:", result);
    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy đơn hàng' }),
        { status: 404 }
      );
    }
  await db.collection('orderHistory').insertOne({
  ...data,
  id, // đảm bảo có ID để backup theo đơn
  backupBy: userName || 'Unknown',
  backupAt: new Date()
});
    return new Response(
      JSON.stringify({ message: 'Cập nhật đơn hàng thành công' }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Lỗi PUT /api/orders/[id]:", error);
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
    const filter = { id };

    const result = await db.collection('orders').deleteOne(filter);
    console.log("Delete result:", result);
    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy đơn hàng' }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ message: 'Xóa đơn hàng thành công' }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/orders/[id]:", error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
