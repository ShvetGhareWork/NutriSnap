const mongoose = require('mongoose');

const clientRelationshipSchema = new mongoose.Schema({
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    connectedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure a member can only have one active relationship at a time (simplified version)
// clientRelationshipSchema.index({ member: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

module.exports = mongoose.model('ClientRelationship', clientRelationshipSchema);
