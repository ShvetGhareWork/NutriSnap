const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get all active chats for a user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        console.log("DEBUG: GET /api/chat called with userId:", userId);
        
        if (!userId || userId === 'undefined') {
            return res.status(400).json({ success: false, error: 'Valid User ID required' });
        }

        const mongoose = require('mongoose');
        const userObjId = new mongoose.Types.ObjectId(userId);

        const chats = await Chat.find({ 
            participants: { $in: [userObjId, userId] } 
        })
        .populate('participants', 'email role firstName lastName')
        .sort({ updatedAt: -1 });

        console.log(`DEBUG: Found ${chats.length} chats for user ${userId}`);
        res.status(200).json({ success: true, count: chats.length, data: chats });
    } catch (error) {
        console.error('Fetch chats error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Create or get existing chat between two users
router.post('/connect', async (req, res) => {
    try {
        const { memberId, coachId } = req.body;

        if (!memberId || !coachId) {
            return res.status(400).json({ success: false, error: 'Member and Coach IDs are required' });
        }

        // Check if 1-to-1 chat already exists between exactly these two
        let chat = await Chat.findOne({
            participants: { $all: [memberId, coachId], $size: 2 }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [memberId, coachId],
                lastMessage: '',
            });
        }

        res.status(200).json({ success: true, data: chat });
    } catch (error) {
        console.error('Connect chat error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get messages for a specific chat
router.get('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chatId })
            .populate('senderId', 'role email firstName lastName')
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
