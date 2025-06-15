// server.js
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { clerkClient } = require("@clerk/clerk-sdk-node");
require("dotenv").config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigin = process.env.CLIENT_URL;

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.options("*", cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());
//app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB YES
mongoose
  .connect(process.env.MONGO_URI, {
  
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== USER MANAGEMENT SCHEMAS =====
const userSchema = new mongoose.Schema({
  clerkId: String,
  fullName: String,
  age: Number,
  gender: String,
  skills: [String],
  learnSkills: [String],
  rating: { type: Number, default: 2 },
  email: String,
  socketId: { type: String, default: null },
  lastSeen: { type: Date, default: Date.now },
  unreadMessages: [{
    sender: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: Number, default: () => Date.now() },
    read: { type: Boolean, default: false },
    id: { type: String, required: true }
  }]
});

const User = mongoose.model("users", userSchema);

// Authentication middleware
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token with Clerk
      const { sub } = await clerkClient.verifyToken(token);
      
      if (!sub) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
      
      // Get user from Clerk
      const user = await clerkClient.users.getUser(sub);
      
      // Add user to request object
      req.user = {
        id: user.id,
        email: user.emailAddresses[0].emailAddress
      };
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000
});

// Map to store user sessions
const userSessions = new Map();

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('No token provided in socket connection');
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      // Verify token with Clerk
      console.log('Verifying token for socket connection...');
      const { sub } = await clerkClient.verifyToken(token);
      
      if (!sub) {
        console.log('Invalid token in socket connection');
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Get user from Clerk
      const user = await clerkClient.users.getUser(sub);
      
      // Store user data in socket
      socket.user = {
        id: user.id,
        email: user.emailAddresses[0].emailAddress
      };
      
      console.log(`Socket authenticated for user: ${socket.user.email}`);
      next();
    } catch (error) {
      console.error('Socket token verification error:', error);
      return next(new Error('Authentication error: Invalid token'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Server error'));
  }
});

// Socket connection handler
io.on('connection', async (socket) => {
  try {
    const userEmail = socket.user.email;
    
    console.log(`User connected: ${userEmail} with socket ID: ${socket.id}`);
    let clerkId = null;
    try {
      // Search for users with the given email
      const users = await clerkClient.users.getUserList({
        emailAddress: userEmail
      });
      
      // If a user with this email exists, return their ID
      if (users['data'].length > 0) {
        clerkId = users.data[0].id;
      } 
    } catch (error) {
      console.error('Error fetching user by email:', error);
    }
    if (!clerkId) {
      return next(new Error('Email missing!'));
    }
    // Update user's socket ID and last seen in database
    let user = await User.findOne({ email: userEmail });
    
    if (!user) {
      // Create new user if not exists
      user = new User({ email: userEmail, clerkId: clerkId});
    }
    
    user.socketId = socket.id;
    user.lastSeen = new Date();
    await user.save();
    
    // Map user email to socket ID
    userSessions.set(userEmail, socket.id);
    
    // Send any unread messages to the user
    if (user.unreadMessages && user.unreadMessages.length > 0) {
      console.log(`Sending ${user.unreadMessages.length} unread messages to ${userEmail}`);
      socket.emit('unread-messages', user.unreadMessages);
      
      // Clear unread messages
      user.unreadMessages = [];
      await user.save();
    }
    
    // Handle joining chat room
    socket.on('join-chat', async (receiverEmail) => {
      try {
        console.log(`${userEmail} is joining chat with ${receiverEmail}`);
        
        // Create a unique room name (sorted emails to ensure consistency)
        const participants = [userEmail, receiverEmail].sort();
        const roomName = `chat_${participants.join('_')}`;
        
        // Join the room
        socket.join(roomName);
        
        console.log(`${userEmail} joined room: ${roomName}`);
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });
    
    // Handle sending messages
    socket.on('send-message', async (data, callback) => {
      try {
        const { receiver, message } = data;
        
        console.log(`Processing message from ${userEmail} to ${receiver}: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
        
        if (!receiver || !message) {
          console.log('Invalid message data: missing receiver or message');
          if (typeof callback === 'function') {
            return callback({ success: false, error: 'Receiver and message are required' });
          }
          return;
        }
        
        // Create message ID and timestamp
        const messageId = uuidv4();
        const timestamp = Date.now();
        
        // Create message object
        const newMessage = {
          sender: userEmail,
          receiver: receiver,
          message,
          time: timestamp,
          read: false,
          id: messageId
        };
        
        // Find receiver
        let receiverUser = await User.findOne({ email: receiver });
        
        if (!receiverUser) {
          // Create new user if not exists
          receiverUser = new User({ email: receiver });
          await receiverUser.save();
          console.log(`New user created for ${receiver}`);
        }
        
        // Create a unique room name (sorted emails to ensure consistency)
        const participants = [userEmail, receiver].sort();
        const roomName = `chat_${participants.join('_')}`;
        
        // Check if receiver is online
        if (receiverUser.socketId) {
          console.log(`Receiver ${receiver} is online with socket ID: ${receiverUser.socketId}`);
          
          // Receiver is online, send message via socket
          // First, send to the sender (with SELF format)
          socket.emit('new-message', {
            ...newMessage,
            sender: 'SELF'
          });
          
          // Then send to the receiver
          const receiverSocket = io.sockets.sockets.get(receiverUser.socketId);
          if (receiverSocket) {
            receiverSocket.emit('new-message', newMessage);
            console.log(`Message emitted to receiver ${receiver}`);
          } else {
            console.log(`Receiver socket not found despite having socketId, storing as unread`);
            receiverUser.unreadMessages.push(newMessage);
            await receiverUser.save();
          }
        } else {
          console.log(`Receiver ${receiver} is offline, storing message as unread`);
          
          // Receiver is offline, store message in their unread messages
          receiverUser.unreadMessages.push(newMessage);
          await receiverUser.save();
          
          // Still emit to sender (with SELF format)
          socket.emit('new-message', {
            ...newMessage,
            sender: 'SELF'
          });
        }
        
        // Send acknowledgment to sender
        if (typeof callback === 'function') {
          callback({ 
            success: true, 
            messageDetails: {
              id: messageId,
              time: timestamp
            }
          });
          console.log(`Acknowledgment sent to ${userEmail} for message ${messageId}`);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });
    
    // Handle message read status
    socket.on('mark-read', async (data) => {
      try {
        const { messageId } = data;
        console.log(`Marking message ${messageId} as read`);
        
        // Find the message sender
        const senderEmail = await findMessageSender(messageId);
        
        if (senderEmail) {
          // Notify sender that message was read
          const senderSocketId = userSessions.get(senderEmail);
          
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-read', { messageId });
            console.log(`Notified sender ${senderEmail} that message ${messageId} was read`);
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userEmail}`);
      
      // Update user's socket ID and last seen in database
      await User.findOneAndUpdate(
        { email: userEmail },
        { 
          socketId: null,
          lastSeen: new Date()
        }
      );
      
      // Remove user from sessions map
      userSessions.delete(userEmail);
    });
  } catch (error) {
    console.error('Socket connection error:', error);
  }
});

// Helper function to find message sender
async function findMessageSender(messageId) {
  try {
    // Check unreadMessages of all users to find the sender
    const user = await User.findOne({ 'unreadMessages.id': messageId });
    
    if (user) {
      const message = user.unreadMessages.find(msg => msg.id === messageId);
      return message ? message.sender : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding message sender:', error);
    return null;
  }
}

// ===== USER MANAGEMENT ROUTES =====

// Save or update user profile
app.post("/api/users", async (req, res) => {
  try {
    const { clerkId, fullName, age, gender, skills, learnSkills, rating, email } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { 
        fullName, 
        age, 
        gender, 
        skills, 
        learnSkills, 
        rating: rating || 2,
        email 
      },
      { upsert: true, new: true }
    );
    console.log(`📝 Updated user [${clerkId}]:`, user);
    res.status(201).json({ message: "✅ User saved", user });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ message: "❌ Failed to save user" });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("❌ Fetch users error:", error);
    res.status(500).json({ message: "❌ Failed to fetch users" });
  }
});

// Submit feedback for a user
app.post("/api/feedback", async (req, res) => {
  try {
    const { clerkId, newRating } = req.body;

    if (!clerkId || typeof newRating !== "number" || newRating < 1 || newRating > 5) {
      return res.status(400).json({ message: "❌ Rating must be a number between 1 and 5" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    // Optional: average the rating with previous one
    user.rating = Math.round((user.rating + newRating) / 2);

    await user.save();
    console.log(`⭐ Feedback saved for ${clerkId}: New rating is ${user.rating}`);

    res.json({ message: "✅ Feedback submitted", rating: user.rating });
  } catch (error) {
    console.error("❌ Feedback error:", error);
    res.status(500).json({ message: "❌ Failed to submit feedback" });
  }
});

// ===== MESSAGING SYSTEM ROUTES =====

// Get unread messages
app.get('/api/messages/unread', requireAuth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find user in database
    let user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get unread messages
    const unreadMessages = user.unreadMessages || [];
    
    // Clear unread messages from user
    user.unreadMessages = [];
    await user.save();
    
    return res.status(200).json({ messages: unreadMessages });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
app.post('/api/messages/send', requireAuth, async (req, res) => {
  try {
    const { receiver, message } = req.body;
    const sender = req.user.email;
    
    console.log(`REST API: Message from ${sender} to ${receiver}: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
    
    if (!receiver || !message) {
      return res.status(400).json({ error: 'Receiver and message are required' });
    }
    
    // Create message ID
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    // Create message object
    const newMessage = {
      sender,
      receiver,
      message,
      time: timestamp,
      read: false,
      id: messageId
    };
    
    // Find receiver in database
    let receiverUser = await User.findOne({ email: receiver });
    
    // If receiver doesn't exist, create them
    if (!receiverUser) {
      receiverUser = new User({ email: receiver });
    }
    
    // Check if receiver is online (has a socketId)
    if (receiverUser.socketId) {
      console.log(`REST API: Receiver ${receiver} is online with socket ID: ${receiverUser.socketId}`);
      
      // Send message directly to receiver
      const receiverSocket = io.sockets.sockets.get(receiverUser.socketId);
      if (receiverSocket) {
        receiverSocket.emit('new-message', newMessage);
        console.log(`Message emitted to receiver ${receiver}`);
      } else {
        console.log(`Receiver socket not found despite having socketId, storing as unread`);
        receiverUser.unreadMessages.push(newMessage);
        await receiverUser.save();
      }
    } else {
      console.log(`REST API: Receiver ${receiver} is offline, storing message as unread`);
      
      // Receiver is offline, store message in their unread messages
      receiverUser.unreadMessages.push(newMessage);
      await receiverUser.save();
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Message sent',
      messageDetails: {
        id: messageId,
        time: timestamp
      }
    });
  } catch (error) {
    console.error('Error sending message via REST API:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user status
app.get('/api/messages/user-status/:email', requireAuth, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find user in database
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Determine if user is online
    const isOnline = !!user.socketId;
    
    return res.status(200).json({
      online: isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('Skill Exchange API - User Management and Chat');
});

// Port
const PORT = process.env.PORT || 8000;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
