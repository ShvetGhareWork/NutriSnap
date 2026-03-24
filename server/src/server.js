require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const onboardingRoutes = require('./routes/onboarding');
const profileRoutes = require('./routes/profile');
const coachRoutes = require('./routes/coach');
const activityRoutes = require('./routes/activity');
const mealLogRoutes = require('./routes/mealLog');
const chatRoutes = require('./routes/chat');
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const programsRoutes = require('./routes/programs');
const statsRoutes = require('./routes/stats');
const paymentRoutes = require('./routes/payment');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const { setIo, createNotification } = require('./utils/notificationService');

// Socket.io setup
const allowedOrigins = [
    'http://localhost:3000',
    process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Initialize notification service with io
setIo(io);

// Real-time chat socket handlers
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a specific user room (userId)
    socket.on('join_user', (userId) => {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} joined user room: ${userId}`);
    });

    // Join a specific chat room (chatId)
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
        try {
            const { chatId, senderId, text, image, bullets } = data;

            // 1. Save to database
            const Message = require('./models/Message');
            const Chat = require('./models/Chat');

            const newMessage = await Message.create({
                chatId,
                senderId,
                text: text || '',
                image,
                bullets: bullets || []
            });

            // 2. Update the Chat's last message timestamp & excerpt
            const historyText = image ? '📷 Photo' : (text || '');
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: historyText,
                updatedAt: new Date()
            });

            // 3. Broadcast the message to the chat room
            await newMessage.populate('senderId', 'role firstName lastName email');
            io.to(chatId).emit('receive_message', newMessage);

            // 4. Send a notification to other participants
            const chat = await Chat.findById(chatId).populate('participants', 'firstName lastName email');
            if (chat) {
                const sender = chat.participants.find(p => p._id.toString() === senderId.toString());
                const senderName = sender ? (sender.firstName ? `${sender.firstName} ${sender.lastName}` : sender.email.split('@')[0]) : 'Someone';

                chat.participants.forEach(participant => {
                    if (participant._id.toString() !== senderId.toString()) {
                        createNotification({
                            userId: participant._id,
                            title: `New message from ${senderName}`,
                            message: image ? 'Shared a photo' : (text?.length > 50 ? text.substring(0, 47) + "..." : text),
                            type: 'message',
                            metadata: { chatId, senderId }
                        });
                    }
                });
            }

        } catch (error) {
            console.error('Socket send_message error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use('/api/account', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/meal-log', mealLogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payment', paymentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Global Error:', err);
    if (res.headersSent) {
        return next(err);
    }
    const safeError = err instanceof Error ? err.message : String(err);
    res.status(500).json({
        success: false,
        error: 'Server Error: ' + safeError
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT} with WebSockets`));
