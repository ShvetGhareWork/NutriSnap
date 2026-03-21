const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: String,
    weeks: {
        type: Number,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    emoji: {
        type: String,
        default: '🏋️'
    },
    gradientFrom: {
        type: String,
        default: '#f5e6c8'
    },
    gradientTo: {
        type: String,
        default: '#d4a96a'
    },
    weeksData: [{
        id: Number,
        name: String,
        detail: String,
        exercises: [{
            id: String,
            name: String,
            sets: String,
            reps: String,
            rest: String,
            note: String
        }],
        cardio: [{
            id: String,
            machine: String,
            duration: String,
            intensity: String
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
