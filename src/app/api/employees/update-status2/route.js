import { connectToDatabase } from '../../../lib/mongodb.js';

export async function POST(req) {
  try {
    const { key, status } = await req.json();
    const { db } = await connectToDatabase();

    const result = await db.collection("employees").updateOne(
      { key: Number(key) },
      { $set: { status2: status } }
    );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "Không tìm thấy nhân viên" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Cập nhật trạng thái thành công" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Lỗi server" }), { status: 500 });
  }
}
