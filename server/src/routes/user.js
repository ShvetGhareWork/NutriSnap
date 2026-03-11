const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Update Role
router.post('/role', async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ success: false, error: 'User ID and role are required' });
        }

        if (!['member', 'coach'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ success: true, data: { id: user._id, role: user.role } });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get all Coaches
router.get('/coaches', async (req, res) => {
    try {
        const CoachProfile = require('../models/CoachProfile');
        
        // Find all users with the role 'coach' who have completed onboarding
        const coachUsers = await User.find({ role: 'coach', onboardingComplete: true }, '_id email');
        
        const coachIds = coachUsers.map(u => u._id);
        
        // Fetch their associated profiles
        const profiles = await CoachProfile.find({ user: { $in: coachIds } }).populate('user', 'email');
        
        res.status(200).json({ success: true, count: profiles.length, data: profiles });
    } catch (error) {
        console.error('Fetch coaches error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Fetch user notifications
router.get('/notifications/:userId', async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        const notifications = await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        const notification = await Notification.findById(req.params.notificationId);
        if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
        
        notification.read = true;
        await notification.save();
        
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
