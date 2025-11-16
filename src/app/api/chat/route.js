import { connectToDatabase } from "../../lib/mongodb.js";

export async function GET() {
  const { db } = await connectToDatabase();
  const messages = await db.collection("chat_messages").find({}).sort({ createdAt: 1 }).toArray();
  return new Response(JSON.stringify(messages), { status: 200 });
}

export async function POST(req) {
  const { db } = await connectToDatabase();
  const body = await req.json();

  const message = {
    text: body.text,
    sender: body.sender || "Ẩn danh",
    createdAt: new Date(),
  };

  await db.collection("chat_messages").insertOne(message);

  return new Response(JSON.stringify({ success: true }), { status: 201 });
}
