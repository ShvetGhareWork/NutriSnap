const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');

const { upload } = require('../config/cloudinary');
const { createNotification } = require('../utils/notificationService');

// GET /api/meal-log/user/:userId - Fetch logs for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const logs = await MealLog.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error('Fetch meal logs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/meal-log - Add a new meal log (with optional photo)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { userId, ...logData } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'UserId is required' });
        }

        // Handle nested nutrition object if sent as JSON string (common with FormData)
        let nutrition = logData.nutrition;
        if (typeof nutrition === 'string') {
            try { nutrition = JSON.parse(nutrition); } catch (e) { nutrition = {}; }
        }

        const log = await MealLog.create({
            userId,
            ...logData,
            nutrition,
            imageUrl: req.file ? req.file.path : logData.imageUrl,
            food_name: logData.food_name || logData.foodName
        });

        // Trigger notification for user
        await createNotification({
            userId,
            title: 'Food Logged! 🍎',
            message: `You successfully logged "${log.food_name}". Keep up the good work!`,
            type: 'system',
            metadata: { mealId: log._id }
        });

        // Notify coach if connected
        const ClientRelationship = require('../models/ClientRelationship');
        const relationship = await ClientRelationship.findOne({ member: userId, status: 'active' });
        if (relationship && relationship.coach) {
            const User = require('../models/User');
            const member = await User.findById(userId);
            await createNotification({
                userId: relationship.coach,
                title: 'Client Logged Meal',
                message: `${member ? (member.firstName || member.email) : 'Your client'} just logged a meal: ${log.food_name}`,
                type: 'system',
                metadata: { memberId: userId, mealId: log._id }
            });
        }

        res.status(201).json({ success: true, data: log });
    } catch (error) {
        console.error('Create meal log error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// DELETE /api/meal-log/:id - Delete a meal log
router.delete('/:id', async (req, res) => {
    try {
        const log = await MealLog.findByIdAndDelete(req.params.id);
        if (!log) return res.status(404).json({ success: false, error: 'Log not found' });
        res.status(200).json({ success: true, message: 'Log deleted' });
    } catch (error) {
        console.error('Delete meal log error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
