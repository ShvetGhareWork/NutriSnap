const express = require('express');
const router = express.Router();
const ClientRelationship = require('../models/ClientRelationship');
const Activity = require('../models/Activity');
const MemberProfile = require('../models/MemberProfile');
const Notification = require('../models/Notification');
const User = require('../models/User');
const MealLog = require('../models/MealLog');

// GET /api/coach/clients - Fetch all connected members for a coach
router.get('/clients/:coachId', async (req, res) => {
    try {
        const relationships = await ClientRelationship.find({ 
            coach: req.params.coachId,
            status: { $in: ['active', 'inactive'] } // Fetch both active and inactive
        }).populate('member');

        const clientData = await Promise.all(relationships.map(async (rel) => {
            const profile = await MemberProfile.findOne({ user: rel.member._id });
            const latestActivity = await Activity.findOne({ user: rel.member._id }).sort({ createdAt: -1 });

            // Fetch actual logs for the last 7 days for adherence
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentLogs = await MealLog.find({
                userId: rel.member._id,
                createdAt: { $gte: sevenDaysAgo }
            }).sort({ createdAt: 1 });

            // Calculate actual adherence score and data
            const today = new Date().toISOString().split('T')[0];
            const dailyAdherence = Array(7).fill(0);
            const dayMap = {}; // mapping date strings to indices 0–6
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                dayMap[d.toISOString().split('T')[0]] = i;
            }

            recentLogs.forEach(log => {
                const logDate = new Date(log.createdAt).toISOString().split('T')[0];
                if (dayMap[logDate] !== undefined && profile?.targetCalories) {
                    const cals = log.total_calories || log.nutrition?.calories || 0;
                    dailyAdherence[dayMap[logDate]] += (cals / profile.targetCalories) * 30; // Weighting for scoring
                }
            });

            // Map meals for today
            const todayLogs = recentLogs.filter(log => new Date(log.createdAt).toISOString().split('T')[0] === today);
            const meals = todayLogs.map(log => ({
                id: log._id,
                name: log.food_name || log.foodName,
                kcal: Math.round(log.total_calories || log.nutrition?.calories || 0),
                protein: Math.round(log.total_protein || log.nutrition?.protein || 0),
                status: "logged",
                emoji: log.mealType === 'breakfast' ? "🥣" : log.mealType === 'lunch' ? "🍗" : "🍽️"
            }));

            // Handle progress (caloric compliance for today)
            const totalTodayCals = todayLogs.reduce((sum, l) => sum + (l.total_calories || l.nutrition?.calories || 0), 0);
            const progress = profile?.targetCalories ? Math.min(Math.round((totalTodayCals / profile.targetCalories) * 100), 100) : 0;

            // Logic for initials
            const firstName = profile?.firstName || '';
            const lastName = profile?.lastName || '';
            const initials = (firstName[0] || '') + (lastName[0] || '') || rel.member.email[0].toUpperCase();

            const avatarColors = ["#a3e635", "#f97316", "#818cf8", "#f43f5e", "#2dd4bf"];
            const colorIndex = rel.member._id.toString().charCodeAt(0) % avatarColors.length;

            const timeDiff = latestActivity ? (Date.now() - new Date(latestActivity.createdAt).getTime()) / (1000 * 60) : null;
            const lastActive = timeDiff === null ? "Inactive" :
                timeDiff < 60 ? `${Math.round(timeDiff)}m ago` :
                    timeDiff < 1440 ? `${Math.round(timeDiff / 60)}h ago` :
                        `${Math.round(timeDiff / 1440)}d ago`;

            return {
                id: rel.member._id,
                initials: initials,
                name: profile ? `${profile.firstName} ${profile.lastName}` : rel.member.email,
                goal: profile ? (({ 'cut': 'WEIGHT LOSS', 'bulk': 'MUSCLE GAIN', 'maintain': 'MAINTENANCE' })[profile.goal] || 'MAINTENANCE') : 'MAINTENANCE',
                status: rel.status.charAt(0).toUpperCase() + rel.status.slice(1),
                progress: progress || 0,
                calories: profile?.targetCalories || 2000,
                protein: `${profile?.targetProtein || 150}g`,
                workouts: "N/A", // Still mocked as we don't have workout logs yet
                lastActive: lastActive,
                avatarColor: avatarColors[colorIndex],
                weight: profile?.weightKg ? (profile.weightKg * 2.20462).toFixed(1) : 180,
                weightDelta: "-0.5 lbs this wk", // Mocked delta
                bmi: profile?.heightCm && profile?.weightKg ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1) : 24.0,
                bmiLabel: "Calculated",
                bodyFat: 18.2, // Mocked
                bodyFatDelta: "Stable",
                adherenceScore: Math.min(Math.round(dailyAdherence.reduce((a, b) => a + b, 0) / 7), 100),
                adherenceData: dailyAdherence.map(v => Math.min(v, 100)),
                tier: "PRO COACHING",
                joined: new Date(rel.connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                meals: meals,
                coachNote: profile?.experience === 'beginner' ? "Early stage: keep consistent with logging." : "Monitor macros carefully."
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
        const coachId = req.params.coachId;
        const Program = require('../models/Program');
        const Message = require('../models/Message');

        const [totalClients, totalPrograms, totalMessages] = await Promise.all([
            ClientRelationship.countDocuments({ coach: coachId, status: 'active' }),
            Program.countDocuments({ coach: coachId }),
            Message.countDocuments({ senderId: coachId })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalClients,
                activeUsers: totalClients,
                programs: totalPrograms,
                messages: totalMessages,
                adherence: "84.2%" // Mocked for now until nutrition is linked
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
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
                time: `Requested ${new Date(r.createdAt).toLocaleDateString()}`,
                profile: profile // Include full profile for coach to view before accepting
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
