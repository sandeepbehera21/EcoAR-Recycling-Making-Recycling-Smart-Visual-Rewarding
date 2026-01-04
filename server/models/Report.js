const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: { type: String, enum: ['bin_issue', 'bug', 'suggestion', 'other'], required: true },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    binId: { type: mongoose.Schema.Types.ObjectId, ref: 'BinLocation' },
    photoURL: { type: String },
    status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'rejected'], default: 'pending' },
    adminNotes: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
