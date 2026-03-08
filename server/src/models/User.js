const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false, // For OAuth potentially
    },
    role: {
        type: String,
        enum: ['member', 'coach'],
        required: false, // Selected after registration
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    onboardingComplete: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);
module.exports = User;
