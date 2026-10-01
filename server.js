const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/Database.js");
const { Server } = require("socket.io");
const http = require("http");

// Load environment variables first
dotenv.config();

// Database connection
connectDB();

// Express app
const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/v1/user", require("./routes/userRoute.js"));

// Create HTTP server (for both Express and Socket.IO)
const httpServer = http.createServer(app);

// Socket.IO setup (Declared ONLY ONCE)
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Replace with your frontend URL (or use "*" for development)
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to controllers
app.set("io", io);

// Handle socket connections
require("./sockets/socketHandler.js")(io);

// Start the server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.bgGreen.black);
});