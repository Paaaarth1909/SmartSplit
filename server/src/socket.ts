import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { GroupMessage } from "./models/GroupMessage.js";

let io: Server | null = null;

export interface ChatMessagePayload {
  groupId: string;
  senderId: string;
  senderName: string;
  message: string;
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.join("global");

    socket.on("join-group", (groupId: string) => {
      if (groupId) {
        const room = `group:${groupId}`;
        socket.join(room);
        console.log(`[Socket.io] Socket ${socket.id} joined room: ${room}`);
      }
    });

    socket.on("leave-group", (groupId: string) => {
      if (groupId) {
        const room = `group:${groupId}`;
        socket.leave(room);
        console.log(`[Socket.io] Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on("chat:send", async (payload: ChatMessagePayload) => {
      try {
        const { groupId, senderId, senderName, message } = payload;
        if (!groupId || !message || !message.trim()) return;

        const chatRecord = await GroupMessage.create({
          group: groupId,
          senderId: senderId || "anonymous",
          senderName: senderName || "Member",
          message: message.trim()
        });

        const room = `group:${groupId}`;
        const broadcastData = {
          _id: chatRecord._id,
          groupId,
          senderId: chatRecord.senderId,
          senderName: chatRecord.senderName,
          message: chatRecord.message,
          createdAt: chatRecord.createdAt
        };

        io?.to(room).emit("chat:message", broadcastData);
        console.log(`[Socket.io] Live chat message broadcasted in ${room}`);
      } catch (err) {
        console.error("[Socket.io] Error processing live chat message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

export const emitToGroup = (groupId: string, event: string, payload: any) => {
  if (io) {
    const room = `group:${groupId}`;
    io.to(room).emit(event, payload);
    console.log(`[Socket.io] Emitted '${event}' to room '${room}'`);
  }
};
