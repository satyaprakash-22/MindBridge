require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const prisma = require('./lib/prisma');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:8081',
].filter(Boolean);

const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const youthRoutes = require('./routes/youth');
const mentorRoutes = require('./routes/mentor');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const moodRoutes = require('./routes/mood');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/youth', youthRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mood', moodRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MindBridge Backend is running' });
});

// Socket.IO connection for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_chat', (data) => {
    socket.join(data.chatId);
    console.log(`User ${socket.id} joined chat ${data.chatId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          chatId: data.chatId,
          sender: data.sender,
          content: data.content
        }
      });
      io.to(data.chatId).emit('receive_message', message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`MindBridge Backend running on port ${PORT}`);
});

module.exports = { app, prisma, io };
