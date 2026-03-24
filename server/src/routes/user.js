const express = require('express');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const MemberProfile = require('../models/MemberProfile');
const Feedback = require('../models/Feedback');

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

// Delete single notification
router.delete('/notifications/:notificationId', async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        await Notification.findByIdAndDelete(req.params.notificationId);
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Clear all notifications for user
router.delete('/notifications/:userId/clear', async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        await Notification.deleteMany({ user: req.params.userId });
        res.status(200).json({ success: true, message: 'Notifications cleared' });
    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get User Settings
router.get('/settings/:userId', async (req, res) => {
    try {
        let settings = await UserSettings.findOne({ user: req.params.userId });
        
        // If no settings exist, create them
        if (!settings) {
            settings = await UserSettings.create({ user: req.params.userId });
        }
        
        // Fetch MemberProfile for target macros
        const profile = await MemberProfile.findOne({ user: req.params.userId });
        
        res.status(200).json({ 
            success: true, 
            data: {
                ...settings.toObject(),
                targets: {
                    ...settings.targets,
                    calories: profile ? profile.targetCalories : 2000,
                    protein: profile ? profile.targetProtein : 150,
                    water: settings.targets.water || 3000
                }
            } 
        });
    } catch (error) {
        console.error('Fetch settings error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update User Settings
router.put('/settings/:userId', async (req, res) => {
    try {
        const { notifications, ai, analytics, targets } = req.body;
        
        // Update UserSettings
        const settings = await UserSettings.findOneAndUpdate(
            { user: req.params.userId },
            { 
                notifications, 
                ai, 
                analytics, 
                'targets.water': targets?.water || 3000 
            },
            { new: true, upsert: true }
        );
        
        // Sync macro targets to MemberProfile if provided
        if (targets?.calories || targets?.protein || targets?.water) {
            await MemberProfile.findOneAndUpdate(
                { user: req.params.userId },
                { 
                    targetCalories: targets.calories,
                    targetProtein: targets.protein,
                    targetWater: targets.water
                }
            );
        }
        
        res.status(200).json({ 
            success: true, 
            data: {
                ...settings.toObject(),
                targets: {
                    ...settings.targets,
                    calories: targets?.calories || 2000,
                    protein: targets?.protein || 150,
                    water: settings.targets.water
                }
            } 
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Submit Support Feedback (Bug or Feature)
router.post('/feedback', async (req, res) => {
    try {
        const { userId, type, title, description } = req.body;
        
        if (!type || !title || !description) {
            return res.status(400).json({ success: false, error: 'Type, title and description are required' });
        }
        
        const feedback = await Feedback.create({
            user: userId,
            type,
            title,
            description
        });
        
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        console.error('Feedback submit error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
