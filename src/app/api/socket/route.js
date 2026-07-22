import { Server } from "socket.io";
import { connectToDatabase } from "../../lib/mongodb";

let io; // giữ socket server toàn cục để không tạo lại nhiều lần

export async function GET() {
  if (!io) {
    const { db } = await connectToDatabase();

    // tạo Socket.IO server dùng port hiện tại (Next dev chạy ở port 3000)
    io = new Server(3001, {
      cors: { origin: "*" },
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("join", (user) => {
        socket.data.user = user;
        console.log("User joined:", user);
      });

      socket.on("chatMessage", async (msg) => {
        const message = {
          text: msg.text,
          replyTo: msg.replyTo || null,
          senderId: msg.userId,
          senderRole: msg.role,
          senderName: msg.name,
          createdAt: new Date(),
        };
        await db.collection("messages").insertOne(message);
        io.emit("chatMessage", message);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    console.log("🚀 Socket.IO server started on port 3001");
  }

  return new Response("Socket.IO server running", { status: 200 });
}
