import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "https://smartsplit-1qz1.onrender.com";

    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
  }
  return socket;
};
