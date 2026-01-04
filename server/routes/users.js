const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').populate('badges');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /users/:id/points - Update user points
router.put('/:id/points', authMiddleware, async (req, res) => {
    const { points, operation } = req.body;

    try {
        let updateQuery = {};

        if (operation === 'set') {
            updateQuery = { points: points };
        } else {
            // Default: increment
            updateQuery = { $inc: { points: points } };
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateQuery,
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update points' });
    }
});

// GET /leaderboard - Fetch top users
router.get('/data/leaderboard', async (req, res) => {
    const { type = 'points', limit = 10 } = req.query;

    try {
        const sortField = type === 'weekly' ? 'weeklyScore' : 'points';

        const users = await User.find()
            .select('name email picture points weeklyScore streak')
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit));

        // Add rank to each user
        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            ...user.toObject()
        }));

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
