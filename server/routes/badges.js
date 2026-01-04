const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// GET /badges - Get all badges
router.get('/', async (req, res) => {
    try {
        const badges = await Badge.find();
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

// GET /badges/user/:id - Get user's earned badges
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('badges');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.badges || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user badges' });
    }
});

// POST /badges/assign - Assign badge to user (triggered on milestones)
router.post('/assign', authMiddleware, async (req, res) => {
    const { userId, badgeId } = req.body;

    try {
        const badge = await Badge.findById(badgeId);
        if (!badge) return res.status(404).json({ error: 'Badge not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if already has badge
        if (user.badges.includes(badgeId)) {
            return res.status(400).json({ error: 'User already has this badge' });
        }

        // Add badge and reward points
        await User.findByIdAndUpdate(userId, {
            $push: { badges: badgeId },
            $inc: { points: badge.pointsReward || 0 }
        });

        res.json({ message: 'Badge assigned successfully', badge });
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign badge' });
    }
});

// POST /badges - Admin: create new badge
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    const { title, description, iconURL, criteria, pointsReward } = req.body;

    try {
        const badge = new Badge({ title, description, iconURL, criteria, pointsReward });
        await badge.save();
        res.status(201).json(badge);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create badge' });
    }
});

// Check and award badges automatically based on user stats
router.post('/check/:userId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('badges');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const allBadges = await Badge.find();
        const earnedBadgeIds = user.badges.map(b => b._id.toString());
        const newBadges = [];

        for (const badge of allBadges) {
            if (earnedBadgeIds.includes(badge._id.toString())) continue;

            let earned = false;
            const criteria = badge.criteria;

            if (criteria) {
                switch (criteria.type) {
                    case 'scan_count':
                        const scanCount = user.history ? user.history.length : 0;
                        earned = scanCount >= criteria.value;
                        break;
                    case 'streak':
                        earned = user.streak >= criteria.value;
                        break;
                    case 'points':
                        earned = user.points >= criteria.value;
                        break;
                }
            }

            if (earned) {
                await User.findByIdAndUpdate(user._id, {
                    $push: { badges: badge._id },
                    $inc: { points: badge.pointsReward || 0 }
                });
                newBadges.push(badge);
            }
        }

        res.json({ newBadges, message: `Awarded ${newBadges.length} new badges` });
    } catch (error) {
        console.error('Badge Check Error:', error);
        res.status(500).json({ error: 'Failed to check badges' });
    }
});

module.exports = router;
