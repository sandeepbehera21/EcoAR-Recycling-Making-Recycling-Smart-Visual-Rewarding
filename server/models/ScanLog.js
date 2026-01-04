const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageURL: { type: String },
    wasteType: { type: String, enum: ['plastic', 'metal', 'paper', 'organic', 'glass', 'ewaste', 'general'] },
    itemDescription: { type: String },
    confidence: { type: Number },
    pointsEarned: { type: Number, default: 0 },
    tip: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScanLog', scanLogSchema);
