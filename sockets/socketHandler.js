const Barber = require("../models/barberModel"); // Adjust path to your Barber model

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Expect the barber to pass their ID when connecting from their dashboard
    const barberId = socket.handshake.auth.barberId || socket.handshake.query.barberId;

    if (barberId) {
      socket.barberId = barberId;

      // Automatically set to online in DB and broadcast
      Barber.findByIdAndUpdate(barberId, { barberStatus: "online" }, { new: true })
        .then((updatedBarber) => {
          if (updatedBarber) {
            io.emit("barberStatusChanged", updatedBarber);
            console.log(`Barber online: ${updatedBarber.name}`);
          }
        })
        .catch(err => console.error("Error setting barber online:", err));
    }

    console.log("New client connected:", socket.id);

    socket.on("disconnect", async () => {
      if (socket.barberId) {
        try {
          // Automatically set to offline in DB and broadcast
          const updatedBarber = await Barber.findByIdAndUpdate(
            socket.barberId, 
            { barberStatus: "offline" }, 
            { new: true }
          );
          if (updatedBarber) {
            io.emit("barberStatusChanged", updatedBarber);
            console.log(`Barber offline: ${updatedBarber.name}`);
          }
        } catch (err) {
          console.error("Error setting barber offline:", err);
        }
      }
      console.log("User disconnected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
    });
  });
};