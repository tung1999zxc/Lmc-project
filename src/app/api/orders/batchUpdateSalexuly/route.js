// src/app/api/orders/batchUpdateSalexuly/route.js
import { connectToDatabase } from '../../../../app/lib/mongodb.js';

export async function POST(req) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('orders');

    // Danh sách tất cả các bạn sale còn lại (ngoại trừ Bùi Yến Nhi)
    const otherSales = [
      "Bùi Thị Thu Trang",
      "Bùi Yến Nhi",
      "Hoàng Thị Oanh",
      "Nguyễn Thị Thúy Quỳnh",
      "Nguyễn Thị Hồng Ngọc 2",
      
    ];

    // Lọc đơn theo điều kiện:
    // - Người xử lý hiện tại là Bùi Yến Nhi
    // - saleReport = DONE
    // - paymentStatus = CHƯA THANH TOÁN
    // - orderDate từ 2026-08-01 đến 2026-08-20
    const orders = await collection.find({
      salexuly: "Trần Thị Hồng Nhung",
      saleReport: "DONE",
      paymentStatus: "ĐÃ THANH TOÁN",
      orderDate: {
        $gte: "2026-08-01",
        $lte: "2026-08-05"
      }
    }).toArray();

    if (orders.length === 0) {
      return new Response(JSON.stringify({
        message: 'Không có đơn phù hợp với điều kiện lọc.'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Chia đều danh sách đơn cho các sale khác
    const updates = orders.map((order, index) => {
      const newSale = otherSales[index % otherSales.length];

      return {
        updateOne: {
          filter: { id: order.id },
          update: {
            $set: {
              salexuly: newSale
            }
          }
        }
      };
    });

    // Thực thi cập nhật hàng loạt
    const result = await collection.bulkWrite(updates);

    return new Response(JSON.stringify({
      message: `Đã chia đều ${orders.length} đơn của Bùi Yến Nhi cho ${otherSales.length} nhân viên khác.`,
      modifiedCount: result.modifiedCount,
      distribution: otherSales
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("Lỗi cập nhật salexuly hàng loạt:", error);

    return new Response(
      JSON.stringify({
        error: 'Lỗi server nội bộ'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}


// // src/app/api/orders/batchUpdateSalexuly/route.js
// import { connectToDatabase } from '../../../../app/lib/mongodb.js';

// export async function POST(req) {
//   try {
//     const { db } = await connectToDatabase();
//     const collection = db.collection('orders');

//     // Tìm tất cả đơn có salexuly là "Đỗ Uyển Nhi"
//     const orders = await collection.find({ salexuly: "Đỗ Uyển Nhi" }).toArray();

//     const updates = orders.map(order => {
//       const newName = "Nguyễn Thị Thúy Quỳnh";
//       // const newName = (order.stt % 2 === 0)
//       //   ? "Lê Linh Chi"
//       //   : "Trần Thị Hồng Nhung";

//       return {
//         updateOne: {
//           filter: { id: order.id },
//           update: { $set: { salexuly: newName } }
//         }
//       };
//     });

//     // Nếu không có đơn nào thì return sớm
//     if (updates.length === 0) {
//       return new Response(JSON.stringify({ message: 'Không có đơn hàng cần cập nhật' }), {
//         status: 200
//       });
//     }

//     const result = await collection.bulkWrite(updates);
//     return new Response(JSON.stringify({
//       message: `Đã cập nhật thành công ${result.modifiedCount} đơn hàng`,
//     }), {
//       status: 200
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật salexuly hàng loạt:", error);
//     return new Response(JSON.stringify({ error: 'Lỗi server nội bộ' }), {
//       status: 500
//     });
//   }
// }
