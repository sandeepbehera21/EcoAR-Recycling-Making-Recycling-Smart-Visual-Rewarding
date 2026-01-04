const mongoose = require('mongoose');

const binLocationSchema = new mongoose.Schema({
    binId: { type: String, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    binType: { type: String, enum: ['plastic', 'mixed', 'paper', 'organic', 'ewaste'], default: 'mixed' },
    address: { type: String },
    isFull: { type: Boolean, default: false },
    isBroken: { type: Boolean, default: false },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportPhoto: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Index for geospatial queries
binLocationSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('BinLocation', binLocationSchema);
