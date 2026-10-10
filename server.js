const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/Database.js");
const { Server } = require("socket.io");
const http = require("http");

// Load environment variables first
dotenv.config();

// Database connection
connectDB();

// Express app
const app = express();

// Determine allowed origin for CORS (production vs local development)
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

// 1. Enable CORS for Express HTTP requests with credentials
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,             // Allows browser to receive and send HttpOnly cookies
  })
);

// 2. Parse incoming cookies into req.cookies
app.use(cookieParser());

// 3. Middlewares
app.use(morgan("dev"));
app.use(express.json());

// 4. Dedicated ping route for 24/7 cron-job uptime monitors
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});

// 5. Routes
app.use("/api/v1", require("./routes/userRoute.js"));
// If you have a separate barber route file, mount it here:
// app.use("/api/v1", require("./routes/barberRoute.js"));

// Create HTTP server (for both Express and Socket.IO)
const httpServer = http.createServer(app);

// Socket.IO setup
const io = require("socket.io")(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to controllers
app.set("io", io);

app.get('/', (req, res) => {
  res.send('BarberQueue API is running...');
});

// Handle socket connections
require("./sockets/socketHandler.js")(io);

// Start the server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.bgGreen.black);
});