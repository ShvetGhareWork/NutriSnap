const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD or formatted string
        required: true
    },
    food_name: {
        type: String,
        required: true
    },
    total_calories: Number,
    total_protein: Number,
    total_carbs: Number,
    total_fat: Number,
    grams: Number,
    servings: Number,
    mealType: String,
    imageUrl: String,
    nutrition: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number,
        sodium: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('MealLog', mealLogSchema);
