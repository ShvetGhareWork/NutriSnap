const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');

// GET /api/meal-log/:userId - Fetch logs for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const logs = await MealLog.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error('Fetch meal logs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/meal-log - Add a new meal log
router.post('/', async (req, res) => {
    try {
        const { userId, ...logData } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'UserId is required' });
        }

        const log = await MealLog.create({
            userId,
            ...logData,
            // Ensure food_name is handled if frontend sends foodName
            food_name: logData.food_name || logData.foodName
        });

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
