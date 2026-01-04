const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    iconURL: { type: String },
    criteria: {
        type: { type: String, enum: ['scan_count', 'streak', 'points', 'weekly_champion', 'waste_type'] },
        value: { type: Number },
        wasteType: { type: String }
    },
    pointsReward: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', badgeSchema);
