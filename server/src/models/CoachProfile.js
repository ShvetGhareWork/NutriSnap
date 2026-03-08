const mongoose = require('mongoose');

const coachProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    bio: { type: String, default: "" },
    certifications: { type: String, default: "" },
    yearsExp: { type: String, default: "" },
    specialties: [{ type: String }],
    coachingStyle: { type: String, required: true },
    clientMethod: { type: String, required: true },
    inviteEmails: [{ type: String }],
    gymName: { type: String, default: "" },
    programStyle: { type: String, default: "" },
    checkInFreq: { type: String, default: "" },
    notifyNewClient: { type: Boolean, default: true },
    notifyProgress: { type: Boolean, default: true },
    notifyMessages: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CoachProfile', coachProfileSchema);
