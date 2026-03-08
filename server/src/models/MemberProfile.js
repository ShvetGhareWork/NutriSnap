const mongoose = require('mongoose');

const memberProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    goal: { type: String, required: true },
    experience: { type: String, required: true },
    activityLevel: { type: String, required: true },
    targetCalories: { type: Number, required: true },
    targetProtein: { type: Number, required: true },
    targetCarbs: { type: Number, required: true },
    targetFat: { type: Number, required: true },
    aiAdaptive: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MemberProfile', memberProfileSchema);
