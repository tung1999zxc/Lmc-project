// src/app/api/socketio/route.js
import { Server } from "socket.io";

export const config = {
  runtime: "nodejs",
};

let io;

export async function GET(request) {
  if (!globalThis.io) {
    console.log("🚀 Khởi tạo Socket.IO server...");

    io = new Server({
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // ✅ Gắn vào globalThis để không khởi tạo lại khi hot reload
    globalThis.io = io;

    io.on("connection", (socket) => {
      console.log("🟢 Client connected:", socket.id);

      // ✅ Gửi cho tất cả client (kể cả người gửi)
      socket.on("message", (msg) => {
        io.emit("message", msg);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔴 Client disconnected:", socket.id, reason);
      });
    });
  }

  return new Response("✅ Socket.IO server is running", { status: 200 });
}
