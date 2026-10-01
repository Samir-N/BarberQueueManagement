module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
    });


  });
};