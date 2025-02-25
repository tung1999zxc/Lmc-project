// src/app/api/products/route.js
import { connectToDatabase } from '../../../app/lib/mongodb.js';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    // Lấy toàn bộ sản phẩm từ collection "products"
    const products = await db.collection('products').find({}).toArray();
    return new Response(
      JSON.stringify({ message: 'Lấy danh sách sản phẩm thành công', data: products }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi GET /api/products:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { name, images, description ,importedQty} = await req.json();

    // Kiểm tra các trường bắt buộc (bạn có thể bổ sung thêm nếu cần)
    if (!name || !images || !description  === undefined) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }),
        { status: 400 }
      );
    }

    const newProduct = {
      key: Date.now(), // Sử dụng timestamp làm định danh duy nhất (kiểu số)
      name,
      images, // mảng base64 strings
      description,
      imports: [
        {
          importedQty,
          importDate: new Date().toISOString().split('T')[0], // định dạng "YYYY-MM-DD"
        },
      ],
      createdAt: new Date(),
    };

    const { db } = await connectToDatabase();
    await db.collection('products').insertOne(newProduct);

    return new Response(
      JSON.stringify({ message: 'Thêm sản phẩm thành công', data: newProduct }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi POST /api/products:', error);
    return new Response(
      JSON.stringify({ error: 'Lỗi server nội bộ' }),
      { status: 500 }
    );
  }
}
