const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// POST /api/activity/log - Log a new activity
router.post('/log', async (req, res) => {
    try {
        const { userId, type, content, metadata } = req.body;
        
        if (!userId || !type || !content) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const activity = await Activity.create({
            user: userId,
            type,
            content,
            metadata: metadata || {}
        });

        res.status(201).json({ success: true, data: activity });
    } catch (error) {
        console.error('Log activity error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
