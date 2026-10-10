import { io } from "socket.io-client";

const VITE_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://barber-queue-api.onrender.com";

const socket = io(VITE_SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export default socket;