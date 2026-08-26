import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

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
