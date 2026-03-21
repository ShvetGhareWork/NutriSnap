const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const ProgramAssignment = require('../models/ProgramAssignment');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const User = require('../models/User');

// GET /api/programs/:coachId - Fetch all coach's programs
router.get('/:coachId', async (req, res) => {
    try {
        const programs = await Program.find({ coach: req.params.coachId });
        
        // Count clients for each program
        const programsWithClients = await Promise.all(programs.map(async (p) => {
            const count = await ProgramAssignment.countDocuments({ program: p._id, status: 'active' });
            return {
                ...p.toObject(),
                id: p._id,
                clients: count
            };
        }));
        
        res.status(200).json({ success: true, data: programsWithClients });
    } catch (error) {
        console.error('Fetch programs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/programs - Create new program
router.post('/', async (req, res) => {
    try {
        const { coach, title, category, description, weeks, level, emoji, gradientFrom, gradientTo, weeksData } = req.body;
        
        const program = await Program.create({
            coach,
            title,
            category,
            description,
            weeks,
            level,
            emoji,
            gradientFrom,
            gradientTo,
            weeksData
        });
        
        res.status(201).json({ success: true, data: program });
    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/programs/assign - Assign program to many clients
router.post('/assign', async (req, res) => {
    try {
        const { programId, clientIds, coachId } = req.body;
        
        const assignments = await Promise.all(clientIds.map(async (clientId) => {
            // Check if already assigned
            const existing = await ProgramAssignment.findOne({ program: programId, member: clientId, status: 'active' });
            if (existing) return existing;
            
            const assignment = await ProgramAssignment.create({
                program: programId,
                member: clientId,
                coach: coachId
            });
            
            // Create notification for client
            const program = await Program.findById(programId);
            await Notification.create({
                user: clientId,
                title: 'New Program Assigned',
                message: `Coach has assigned you the "${program.title}" program!`,
                type: 'program_assignment',
                metadata: { programId }
            });
            
            // Activity log
            await Activity.create({
                user: coachId,
                type: 'goal_reached', // Should use more descriptive type?
                content: `assigned program "${program.title}" to a client`,
                metadata: { memberId: clientId, programId }
            });
            
            return assignment;
        }));
        
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        console.error('Assign program error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/programs/member/:userId - Fetch all programs assigned to a member
router.get('/member/:userId', async (req, res) => {
    try {
        const assignments = await ProgramAssignment.find({ member: req.params.userId, status: 'active' })
            .populate('program')
            .populate('coach', 'firstName lastName email');
        
        const programs = assignments.map(a => {
            const assignmentObj = a.toObject();
            return {
                ...a.program.toObject(),
                assignmentId: a._id,
                coachInfo: {
                    id: a.coach?._id,
                    name: a.coach ? `${a.coach.firstName || ''} ${a.coach.lastName || ''}`.trim() || "Coach" : "Unknown Coach",
                    email: a.coach?.email
                },
                assignedAt: a.assignedAt
            };
        });
        
        res.status(200).json({ success: true, data: programs });
    } catch (error) {
        console.error('Fetch member programs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;

