const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const CoachProfile = require('../models/CoachProfile');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const existing = await User.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role || null,
            isVerified: false,
            onboardingComplete: false,
        });

        res.status(201).json({
            success: true,
            data: { id: user._id, email: user.email, role: user.role, onboardingComplete: user.onboardingComplete },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Login (Used by NextAuth)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user || !user.password) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Fetch name from profile if role is set
        let name = null;
        if (user.role === 'member') {
            const profile = await MemberProfile.findOne({ user: user._id });
            if (profile) name = `${profile.firstName} ${profile.lastName}`;
        } else if (user.role === 'coach') {
            const profile = await CoachProfile.findOne({ user: user._id });
            if (profile) name = profile.name || `${profile.firstName} ${profile.lastName}`;
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                name: name || (user.firstName ? `${user.firstName} ${user.lastName}` : null),
                role: user.role,
                onboardingComplete: user.onboardingComplete
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
