const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    picture: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    points: { type: Number, default: 0 },
    weeklyScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastScanDate: { type: Date },
    hostel: { type: String }, // For hostel/building leaderboard
    lastMissionDate: { type: Date }, // To track when missions were last generated
    dailyMissions: [{
        id: { type: String },
        title: { type: String },
        type: { type: String }, // e.g., 'scan_plastic', 'scan_any', 'invite_friend'
        target: { type: Number },
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        reward: { type: Number } // XP/Points reward
    }],
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ScanLog' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
