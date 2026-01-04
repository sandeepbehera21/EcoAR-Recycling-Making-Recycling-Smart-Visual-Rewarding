const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// POST /reports - Submit a report
router.post('/', authMiddleware, async (req, res) => {
    const { type, message, binId, photoURL } = req.body;

    try {
        const report = new Report({
            type,
            message,
            userId: req.user._id,
            binId,
            photoURL
        });
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

// GET /reports/my - Get current user's reports
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// GET /admin/reports - Admin: view all reports
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
    const { status, type } = req.query;

    try {
        let query = {};
        if (status) query.status = status;
        if (type) query.type = type;

        const reports = await Report.find(query)
            .populate('userId', 'name email')
            .populate('binId')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// PUT /admin/reports/:id - Admin: update report status
router.put('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { status, adminNotes } = req.body;

    try {
        const updateData = { status, adminNotes };

        if (status === 'resolved') {
            updateData.resolvedBy = req.user._id;
            updateData.resolvedAt = new Date();
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// GET /admin/reports/stats - Admin: get report statistics
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const typeStats = await Report.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ byStatus: stats, byType: typeStats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
