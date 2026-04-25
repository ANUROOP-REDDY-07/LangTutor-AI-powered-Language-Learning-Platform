require("dotenv").config();
const express = require("express");
const aiRoutes = require("./routes/ai");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { verifyToken, verifySocketToken } = require("./middleware/auth");
const admin = require("firebase-admin");

// Initialize Firebase Admin (Optional based on how you handle auth verification)
// You may need to provide a service account key JSON file path or env variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());

app.use('/api/ai', aiRoutes);

const XP_LEVELS = [
  { level: 1, xp: 0, title: "Beginner" },
  { level: 2, xp: 150, title: "Learner" },
  { level: 3, xp: 350, title: "Speaker" },
  { level: 4, xp: 700, title: "Communicator" },
  { level: 5, xp: 1200, title: "Confident" },
  { level: 6, xp: 1800, title: "Fluent" },
  { level: 7, xp: 2500, title: "Advanced" },
  { level: 8, xp: 3500, title: "Expert" }
];

function getLevelInfo(xp) {
  let current = XP_LEVELS[0];
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].xp) current = XP_LEVELS[i];
    else break;
  }
  return current;
}

// Secure Endpoint for overall session progression and XP
app.post('/api/progress/session', verifyToken, async (req, res) => {
  try {
    const { xpToAdd = 0, minutes = 0, messages = 0, gamesPlayed = 0 } = req.body;
    const userId = req.user.uid;
    const userRef = admin.firestore().collection('users').doc(userId);

    // Calculate level based on XP progression, assumed 100XP per level mapping.
    // Fetch current user details first
    const doc = await userRef.get();
    let currentXp = 0;
    if (doc.exists) {
      currentXp = doc.data().xp || 0;
    }
    const newXp = currentXp + xpToAdd;
    
    // Level calculation based on high-reward gamification logic
    const levelInfo = getLevelInfo(newXp);

    await userRef.set({
      xp: admin.firestore.FieldValue.increment(xpToAdd),
      totalSessions: admin.firestore.FieldValue.increment(1),
      totalMinutes: admin.firestore.FieldValue.increment(minutes),
      messagesSent: admin.firestore.FieldValue.increment(messages),
      gamesPlayed: admin.firestore.FieldValue.increment(gamesPlayed),
      level: levelInfo.title,
      levelIndex: levelInfo.level
    }, { merge: true });

    res.json({ success: true, newLevel: levelInfo.title, levelIndex: levelInfo.level, newXp });
  } catch (error) {
    console.error("Session Progress Error:", error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.send("LangTutor Signaling Server is running");
});

// Apply Socket Authentication Middleware
io.use(verifySocketToken);

// Simple matchmaking queue for demo purposes
const waitingUsers = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-matchmaking", (data = {}) => {
    console.log(`User ${socket.id} joined matchmaking with data:`, data.userData);
    
    // Remove self if already in queue to prevent ghost-matching
    const existingIndex = waitingUsers.findIndex(u => u.id === socket.id);
    if (existingIndex !== -1) waitingUsers.splice(existingIndex, 1);
    
    if (waitingUsers.length > 0) {
      // Find a match
      const partner = waitingUsers.pop();
      if (partner.id === socket.id) {
         // Should never happen with the check above, but fail-safed
         waitingUsers.push({ id: socket.id, userData: data.userData });
         return socket.emit("waiting-for-match");
      }
      const partnerSocketId = partner.id;
      const roomId = `${socket.id}-${partnerSocketId}-room`;
      
      socket.join(roomId);
      io.sockets.sockets.get(partnerSocketId)?.join(roomId);
      
      // Notify both that match is found and send over partner's data
      io.to(socket.id).emit("match-found", { roomId, partnerId: partnerSocketId, partnerData: partner.userData, initiator: true });
      io.to(partnerSocketId).emit("match-found", { roomId, partnerId: socket.id, partnerData: data.userData, initiator: false });
    } else {
      waitingUsers.push({ id: socket.id, userData: data.userData });
      socket.emit("waiting-for-match");
    }
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", (data) => {
    socket.broadcast.to(data.roomId).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.broadcast.to(data.roomId).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.broadcast.to(data.roomId).emit("ice-candidate", data);
  });

  socket.on("send-message", (data) => {
    socket.broadcast.to(data.roomId).emit("receive-message", data);
  });

  socket.on("send-subtitle", (data) => {
    io.to(data.roomId).emit("receive-subtitle", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const index = waitingUsers.findIndex(u => u.id === socket.id);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
    // Also broadcast peer disconnect if they were in a room
  });
  
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.broadcast.to(roomId).emit("partner-disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
