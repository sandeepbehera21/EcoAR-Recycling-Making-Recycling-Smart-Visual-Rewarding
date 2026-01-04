const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecoar_recycling';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scanRoutes = require('./routes/scans');
const binRoutes = require('./routes/bins');
const badgeRoutes = require('./routes/badges');
const reportRoutes = require('./routes/reports');
const webhookRoutes = require('./routes/webhooks');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/webhook', webhookRoutes);

// Legacy routes for backward compatibility
const ScanLog = require('./models/ScanLog');
const User = require('./models/User');

// GET /api/scan-history/:userId (legacy)
app.get('/api/scan-history/:userId', async (req, res) => {
    try {
        const history = await ScanLog.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST /api/scan-history (legacy)
app.post('/api/scan-history', async (req, res) => {
    const { userId, wasteType, itemDescription, confidence, pointsEarned, tip } = req.body;
    try {
        const scan = new ScanLog({
            userId,
            wasteType,
            itemDescription,
            confidence,
            pointsEarned,
            tip
        });
        await scan.save();

        const user = await User.findById(userId);
        let missionPoints = 0;

        // Update Missions
        if (user.dailyMissions) {
            user.dailyMissions.forEach(mission => {
                if (!mission.completed) {
                    let progressMade = false;
                    // Check mission type logic
                    if (mission.type === 'scan_any') {
                        mission.progress += 1;
                        progressMade = true;
                    } else if (mission.type === `scan_${wasteType}`) { // e.g., scan_plastic
                        mission.progress += 1;
                        progressMade = true;
                    }

                    // Check completion
                    if (progressMade && mission.progress >= mission.target) {
                        mission.completed = true;
                        missionPoints += mission.reward || 0;
                    }
                }
            });
        }

        user.points = (user.points || 0) + (pointsEarned || 0) + missionPoints;
        user.lastScanDate = new Date();
        user.history.push(scan._id);

        await user.save();

        res.json(scan);
    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ error: 'Failed to save scan' });
    }
});

// GET /api/user/:userId (legacy)
app.get('/api/user/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(404).json({ error: 'User not found' });
    }
});

// GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
    const { type = 'points', limit = 10 } = req.query;
    try {
        if (type === 'hostel') {
            const hostels = await User.aggregate([
                { $match: { hostel: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: "$hostel",
                        points: { $sum: "$points" },
                        userCount: { $sum: 1 }
                    }
                },
                { $sort: { points: -1 } },
                { $limit: parseInt(limit) }
            ]);

            const leaderboard = hostels.map((h, i) => ({
                rank: i + 1,
                name: h._id,
                points: h.points,
                avgPoints: Math.round(h.points / h.userCount),
                isHostel: true // Flag to identify hostel records on frontend
            }));
            return res.json(leaderboard);
        }

        const sortField = type === 'weekly' ? 'weeklyScore' : 'points';
        const users = await User.find()
            .select('name email picture points weeklyScore streak role createdAt hostel')
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit));

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   - /api/auth (register, login, google, profile)');
    console.log('   - /api/users (get user, update points, leaderboard)');
    console.log('   - /api/scans (submit scan, get history)');
    console.log('   - /api/bins (nearby, report, manage)');
    console.log('   - /api/badges (get badges, assign)');
    console.log('   - /api/reports (submit, admin manage)');
    console.log('   - /api/webhook (dialogflow, classify)');
});
