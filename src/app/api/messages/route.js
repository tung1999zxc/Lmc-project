// pages/api/messages.js
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  if (req.method === "GET") {
    const raw = await db.collection("messages").find().sort({ createdAt: 1 }).toArray();
    const messages = raw.map(m => ({
      ...m,
      _id: m._id.toString(),
      createdAt: m.createdAt,
    }));
    return res.status(200).json({ ok: true, messages });
  }
  return res.status(405).json({ ok: false, message: "Method not allowed" });
}
