// backend profile
const express = require('express');
const MemberProfile = require('../models/MemberProfile');
const CoachProfile = require('../models/CoachProfile');

const router = express.Router();

router.get('/member/:userId', async (req, res) => {
    try {
        const profile = await MemberProfile.findOne({ user: req.params.userId });
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Fetch member profile error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.put('/member/:userId', async (req, res) => {
    try {
        const body = req.body;
        const profile = await MemberProfile.findOneAndUpdate(
            { user: req.params.userId },
            { ...body, user: req.params.userId },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Update member profile error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.get('/coach/:userId', async (req, res) => {
    try {
        const profile = await CoachProfile.findOne({ user: req.params.userId });
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Fetch coach profile error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.put('/coach/:userId', async (req, res) => {
    try {
        const body = req.body;
        const profile = await CoachProfile.findOneAndUpdate(
            { user: req.params.userId },
            { ...body, user: req.params.userId },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Update coach profile error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
