const express = require('express');
const router = express.Router();
const ScanLog = require('../models/ScanLog');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// POST /scans - Submit a scan result
router.post('/', authMiddleware, async (req, res) => {
    const { imageURL, wasteType, itemDescription, confidence, pointsEarned, tip } = req.body;

    try {
        const scan = new ScanLog({
            userId: req.user._id,
            imageURL,
            wasteType,
            itemDescription,
            confidence,
            pointsEarned,
            tip
        });
        await scan.save();

        // Update user points and streak
        const today = new Date().toISOString().split('T')[0];
        const user = await User.findById(req.user._id);
        const lastScan = user.lastScanDate ? user.lastScanDate.toISOString().split('T')[0] : null;

        let streakUpdate = {};
        if (lastScan !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (lastScan === yesterday) {
                streakUpdate = { $inc: { streak: 1 } };
            } else if (!lastScan) {
                streakUpdate = { streak: 1 };
            } else {
                streakUpdate = { streak: 1 }; // Reset streak
            }
        }

        await User.findByIdAndUpdate(req.user._id, {
            $inc: { points: pointsEarned || 0, weeklyScore: pointsEarned || 0 },
            $push: { history: scan._id },
            lastScanDate: new Date(),
            ...streakUpdate
        });

        res.json(scan);
    } catch (error) {
        console.error('Scan Error:', error);
        res.status(500).json({ error: 'Failed to save scan' });
    }
});

// GET /scans/user/:id - Get all scans by user
router.get('/user/:id', async (req, res) => {
    try {
        const scans = await ScanLog.find({ userId: req.params.id }).sort({ createdAt: -1 });
        res.json(scans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scans' });
    }
});

// Backward compatibility: GET /scan-history/:userId
router.get('/history/:userId', async (req, res) => {
    try {
        const scans = await ScanLog.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(scans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
