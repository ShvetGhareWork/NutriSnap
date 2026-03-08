const express = require('express');
const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const CoachProfile = require('../models/CoachProfile');

const router = express.Router();

// Member Onboarding
router.post('/member', async (req, res) => {
    try {
        const { userId, data } = req.body;

        if (!userId || !data) {
            return res.status(400).json({ success: false, error: 'User ID and data are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        if (user.role !== 'member') return res.status(400).json({ success: false, error: 'User is not a member' });

        // Update or Create profile
        let profile = await MemberProfile.findOne({ user: userId });
        if (profile) {
            Object.assign(profile, data);
            await profile.save();
        } else {
            profile = await MemberProfile.create({ user: userId, ...data });
        }

        user.onboardingComplete = true;
        if (data.firstName) user.firstName = data.firstName;
        if (data.lastName) user.lastName = data.lastName;
        await user.save();

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Member onboarding error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Coach Onboarding
router.post('/coach', async (req, res) => {
    try {
        const { userId, data } = req.body;

        if (!userId || !data) {
            return res.status(400).json({ success: false, error: 'User ID and data are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        if (user.role !== 'coach') return res.status(400).json({ success: false, error: 'User is not a coach' });

        // Update or Create profile
        let profile = await CoachProfile.findOne({ user: userId });
        if (profile) {
            Object.assign(profile, data);
            await profile.save();
        } else {
            profile = await CoachProfile.create({ user: userId, ...data });
        }

        user.onboardingComplete = true;
        if (data.firstName) user.firstName = data.firstName;
        if (data.lastName) user.lastName = data.lastName;
        await user.save();

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Coach onboarding error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
