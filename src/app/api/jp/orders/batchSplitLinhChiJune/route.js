// // File: /src/app/api/orders/batchSplitLinhChiJune/route.js
// import { connectToDatabase } from '../../../../../app/lib/mongodb2';

// export async function POST() {
//   try {
//     const { db } = await connectToDatabase();
//     const collection = db.collection('orders');

//     const teamMembers = [
//       "Phan Thị Bích Ngọc",
//       "Hoàng Thị Oanh",
//       "Trần Thị Hồng Nhung",
//       "Bùi Yến Nhi",
//       "Nguyễn Thái Hà",
//       "Nguyễn Thị Thúy Quỳnh"
//     ];

//     // Lấy đơn hàng của Lê Linh Chi trong tháng 6
//     const orders = await collection
//       .find({
//         salexuly: "Lê Linh Chi",
//         orderDate: {
//           $gte: "2025-05-01",
//           $lte: "2025-05-30"
//         }
//       })
//       .sort({ orderDate: 1 }) // Đảm bảo chia đều theo thứ tự thời gian
//       .toArray();

//     if (orders.length === 0) {
//       return new Response(JSON.stringify({ message: 'Không tìm thấy đơn hàng nào trong tháng 6 của Lê Linh Chi' }), {
//         status: 200
//       });
//     }

//     const updates = orders.map((order, index) => {
//       const assignee = teamMembers[index % teamMembers.length];
//       return {
//         updateOne: {
//           filter: { id: order.id },
//           update: { $set: { salexuly: assignee } }
//         }
//       };
//     });

//     const result = await collection.bulkWrite(updates);

//     return new Response(JSON.stringify({
//       message: `Đã chia đều ${orders.length} đơn hàng cho 6 người`,
//       modifiedCount: result.modifiedCount
//     }), {
//       status: 200
//     });

//   } catch (error) {
//     console.error("Lỗi chia đơn hàng:", error);
//     return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
//       status: 500
//     });
//   }
// }

// File: /src/app/api/orders/batchSplitLinhChiMay/route.js
import { connectToDatabase } from '../../../../../app/lib/mongodb2';

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('orders');

    const teamMembers = [
      "Phan Thị Bích Ngọc",
      "Hoàng Thị Oanh",
      "Trần Thị Hồng Nhung",
      "Bùi Yến Nhi",
      "Nguyễn Thái Hà",
      "Nguyễn Thị Thúy Quỳnh"
    ];

    // 🎯 Lấy đơn hàng của Lê Linh Chi trong tháng 5
    // với saleReport === "DONE" và (chưa thanh toán || chưa giao hàng)
    const orders = await collection.find({
      salexuly: "Lê Linh Chi",
      saleReport: "DONE",
      orderDate: {
        $gte: "2025-05-01",
        $lte: "2025-05-31"
      },
      $or: [
        { paymentStatus: { $ne: "ĐÃ THANH TOÁN" } },
        { deliveryStatus: { $ne: "GIAO THÀNH CÔNG" } }
      ]
    })
    .sort({ orderDate: 1 }) // chia đều theo thời gian
    .toArray();

    if (orders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Không tìm thấy đơn hàng phù hợp để chia' }),
        { status: 200 }
      );
    }

    const updates = orders.map((order, index) => {
      const assignee = teamMembers[index % teamMembers.length];
      return {
        updateOne: {
          filter: { id: order.id },
          update: { $set: { salexuly: assignee } }
        }
      };
    });

    const result = await collection.bulkWrite(updates);

    return new Response(JSON.stringify({
      message: `✅ Đã chia ${orders.length} đơn hàng cho 6 người`,
      modifiedCount: result.modifiedCount
    }), {
      status: 200
    });

  } catch (error) {
    console.error("Lỗi chia đơn hàng:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}
