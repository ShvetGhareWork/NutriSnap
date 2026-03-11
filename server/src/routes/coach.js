const express = require('express');
const router = express.Router();
const ClientRelationship = require('../models/ClientRelationship');
const Activity = require('../models/Activity');
const MemberProfile = require('../models/MemberProfile');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/coach/clients - Fetch all connected members for a coach
router.get('/clients/:coachId', async (req, res) => {
    try {
        const relationships = await ClientRelationship.find({ 
            coach: req.params.coachId,
            status: 'active'
        }).populate('member');

        const clientData = await Promise.all(relationships.map(async (rel) => {
            const profile = await MemberProfile.findOne({ user: rel.member._id });
            return {
                id: rel.member._id,
                name: profile ? `${profile.firstName} ${profile.lastName}` : rel.member.email,
                email: rel.member.email,
                status: 'Active',
                program: profile?.goal || 'General Health',
                compliance: 85, // Mock for now
                connectedAt: rel.connectedAt
            };
        }));

        res.status(200).json({ success: true, data: clientData });
    } catch (error) {
        console.error('Fetch coach clients error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/coach/activities/:coachId - Fetch activities from all connected members
router.get('/activities/:coachId', async (req, res) => {
    try {
        const relationships = await ClientRelationship.find({ 
            coach: req.params.coachId,
            status: 'active'
        });
        
        const memberIds = relationships.map(rel => rel.member);
        
        const activities = await Activity.find({ 
            user: { $in: memberIds } 
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user');

        const formattedActivities = await Promise.all(activities.map(async (act) => {
            const profile = await MemberProfile.findOne({ user: act.user._id });
            return {
                user: profile ? `${profile.firstName} ${profile.lastName}` : act.user.email,
                action: act.content,
                type: act.type,
                time: act.createdAt,
                note: act.metadata?.note
            };
        }));

        res.status(200).json({ success: true, data: formattedActivities });
    } catch (error) {
        console.error('Fetch coach activities error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/coach/stats/:coachId - Fetch aggregate stats for coach
router.get('/stats/:coachId', async (req, res) => {
    try {
        const totalClients = await ClientRelationship.countDocuments({ coach: req.params.coachId, status: 'active' });
        // Simplified mockup for other stats
        res.status(200).json({
            success: true,
            data: {
                totalClients,
                activeUsers: totalClients,
                programs: 12,
                successRate: '87%'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/coach/request - Member sends a request to a coach
router.post('/request', async (req, res) => {
    try {
        const { memberId, coachId } = req.body;
        
        // Check if relationship already exists
        const existing = await ClientRelationship.findOne({ member: memberId, coach: coachId });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Request already exists or already connected' });
        }

        const request = await ClientRelationship.create({
            member: memberId,
            coach: coachId,
            status: 'pending'
        });

        // Log activity
        await Activity.create({
            user: memberId,
            type: 'invite_accepted', // Reusing type or should have 'request_sent'
            content: 'sent a coach request',
            metadata: { coachId }
        });

        // Create Notification for coach
        const member = await User.findById(memberId);
        await Notification.create({
            user: coachId,
            title: 'New Coach Request',
            message: `${member ? member.email : 'A member'} has requested you as their coach.`,
            type: 'request'
        });

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/coach/accept - Coach accepts a member's request
router.post('/accept', async (req, res) => {
    try {
        const { relationshipId } = req.body;
        
        const rel = await ClientRelationship.findById(relationshipId);
        if (!rel) return res.status(404).json({ success: false, error: 'Request not found' });

        rel.status = 'active';
        rel.connectedAt = new Date();
        await rel.save();

        // Log activity for coach feed
        await Activity.create({
            user: rel.member._id,
            type: 'invite_accepted',
            content: 'accepted invite and connected',
            metadata: { coachId: rel.coach }
        });

        // Create Notification for member
        await Notification.create({
            user: rel.member._id,
            title: 'Coach Request Accepted',
            message: 'Your coach has accepted your request. You are now connected!',
            type: 'acceptance'
        });

        res.status(200).json({ success: true, data: rel });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/coach/requests/:coachId - Fetch pending requests for coach
router.get('/requests/:coachId', async (req, res) => {
    try {
        const requests = await ClientRelationship.find({ 
            coach: req.params.coachId, 
            status: 'pending' 
        }).populate('member');

        const formatted = await Promise.all(requests.map(async (r) => {
            const profile = await MemberProfile.findOne({ user: r.member._id });
            return {
                id: r._id,
                name: profile ? `${profile.firstName} ${profile.lastName}` : r.member.email,
                time: `Requested ${new Date(r.createdAt).toLocaleDateString()}`
            };
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/coach/invite - Coach invites a member by email
router.post('/invite', async (req, res) => {
    try {
        const { coachId, email } = req.body;
        
        // Find user by email
        const User = require('../models/User');
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            // Check if already connected
            const existing = await ClientRelationship.findOne({ member: user._id, coach: coachId });
            if (!existing) {
                await ClientRelationship.create({
                    member: user._id,
                    coach: coachId,
                    status: 'pending'
                });
            }
        }

        // Simulating email sending
        console.log(`[INVITE] Coach ${coachId} invited ${email}`);

        res.status(200).json({ success: true, message: 'Invite sent successfully' });
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/coach/client-logs/:memberId - Fetch meal logs for a specific client
router.get('/client-logs/:memberId', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const MealLog = require('../models/MealLog');
        const memberId = req.params.memberId;
        
        console.log(`[DEBUG] Fetching logs for memberId: ${memberId}`);
        
        const logs = await MealLog.find({ 
            userId: new mongoose.Types.ObjectId(memberId) 
        }).sort({ createdAt: -1 }).limit(20);
        
        console.log(`[DEBUG] Found ${logs.length} logs for memberId: ${memberId}`);
        if (logs.length > 0) {
            console.log(`[DEBUG] First log sample: ${JSON.stringify(logs[0]).substring(0, 100)}...`);
        }
        
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error('Fetch client logs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
