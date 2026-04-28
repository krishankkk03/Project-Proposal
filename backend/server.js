const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const http     = require("http");
const { Server } = require("socket.io");

const Message = require("./models/Chat");
const Request = require("./models/Request");

const app    = express();
const server = http.createServer(app);       

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/projectDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/topics",   require("./routes/topicRoutes"));
app.use("/api/faculty",  require("./routes/facultyRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/chat",     require("./routes/chatRoutes"));   
app.use("/api/otp",      require("./routes/otpRoutes"));

app.get("/", (req, res) => res.send("Backend working ✅"));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, senderEmail, senderRole, senderName, message }) => {
    try {
      const request = await Request.findById(roomId);
      if (!request || request.status !== "Approved") return;

      const members = (request.groupDetails || []).map(m => m.email || m);
      const allowed = [request.facultyEmail, request.studentEmail, ...members];

      if (!allowed.includes(senderEmail)) return;

      const saved = await Message.create({
        roomId, senderEmail, senderRole,
        senderName: senderName || "",
        message,
      });

      io.to(roomId).emit("receiveMessage", saved);

    } catch (err) {
      console.log("Socket sendMessage error:", err);
    }
  });           

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));