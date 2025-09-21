const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const dotenv = require("dotenv");
const path = require("path"); // ✅ added for static file serving
const fs = require("fs");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://roadrescue360-frontend.onrender.com', 'https://roadrescue360.onrender.com']
    : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));
// ✅ Serve uploaded files
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/roadrescue360";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit process if MongoDB connection fails
  });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Socket.IO Connection Handling
io.on("connection", (socket) => {
  console.log("Client connected");

  // Join service tracking room
  socket.on("join:service", (serviceId) => {
    socket.join(`service:${serviceId}`);
    console.log(`Client joined service room: ${serviceId}`);
  });

  // Leave service tracking room
  socket.on("leave:service", (serviceId) => {
    socket.leave(`service:${serviceId}`);
    console.log(`Client left service room: ${serviceId}`);
  });

  // Update technician location
  socket.on("location:update", (data) => {
    const { serviceId, location } = data;
    io.to(`service:${serviceId}`).emit("technician:location", location);
    console.log(`Location updated for service: ${serviceId}`);
  });

  // Update service status
  socket.on("status:update", (data) => {
    const { serviceId, status } = data;
    io.to(`service:${serviceId}`).emit("service:status", status);
    console.log(`Status updated for service: ${serviceId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/services", require("./routes/services"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/md", require("./routes/md"));
app.use("/api/emergency", require("./routes/emergency"));
app.use("/api/pricing", require("./routes/pricing"));
app.use("/api/technicians", require("./routes/technicians"));

// ✅ Serve frontend (HTML/JS/CSS) for non-API routes
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
    // 👆 if your main frontend file is "frontend/index.html"
  }
});

// 404 handler for unknown API routes -> return JSON, not HTML
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});
