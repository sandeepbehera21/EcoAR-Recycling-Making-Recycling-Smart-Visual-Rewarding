const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Badge = require('../models/Badge');
const { authMiddleware } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_this';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate daily missions
const generateDailyMissions = () => {
    const missionTypes = [
        { type: 'scan_plastic', title: 'Recycle 2 Plastic Items', target: 2, reward: 50 },
        { type: 'scan_metal', title: 'Recycle 1 Metal Can', target: 1, reward: 40 },
        { type: 'scan_paper', title: 'Recycle 3 Paper Items', target: 3, reward: 30 },
        { type: 'scan_any', title: 'Perform 3 Scans', target: 3, reward: 20 },
        { type: 'scan_ewaste', title: 'Recycle 1 E-Waste Item', target: 1, reward: 100 },
        { type: 'scan_glass', title: 'Recycle 1 Glass Bottle', target: 1, reward: 45 }
    ];

    // Pick 3 random missions
    const shuffled = missionTypes.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map(m => ({
        id: Math.random().toString(36).substr(2, 9),
        ...m,
        progress: 0,
        completed: false
    }));
};

// Helper: Check and refresh daily missions
const checkDailyMissions = async (user) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = user.lastMissionDate ? new Date(user.lastMissionDate) : new Date(0);
    lastDate.setHours(0, 0, 0, 0);

    if (today > lastDate || !user.dailyMissions || user.dailyMissions.length === 0) {
        user.dailyMissions = generateDailyMissions();
        user.lastMissionDate = new Date();
        await user.save();
    }
    return user;
};

// Helper: Assign welcome badge to new users
async function assignWelcomeBadge(user) {
    try {
        // Find or create the "Welcome Warrior" badge
        let welcomeBadge = await Badge.findOne({ title: 'Welcome Warrior' });
        if (!welcomeBadge) {
            welcomeBadge = await Badge.create({
                title: 'Welcome Warrior',
                description: 'Joined the EcoAR community! Your eco-journey begins now 🌱',
                iconURL: '🎉',
                criteria: { type: 'scan_count', value: 0 },
                pointsReward: 10
            });
            console.log('✅ Created Welcome Warrior badge');
        }

        // Assign badge to user if they don't have it
        if (!user.badges.includes(welcomeBadge._id)) {
            user.badges.push(welcomeBadge._id);
            user.points = (user.points || 0) + (welcomeBadge.pointsReward || 10);
            await user.save();
            console.log(`🎖️ Awarded Welcome Warrior badge to ${user.name || user.email}`);
        }
    } catch (error) {
        console.error('Failed to assign welcome badge:', error);
    }
}

// POST /auth/register
router.post('/register', async (req, res) => {
    const { email, password, username, hostel } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
            email,
            password: hashedPassword,
            name: username || email.split('@')[0],
            hostel: hostel || null,
            dailyMissions: generateDailyMissions(),
            lastMissionDate: new Date()
        });
        await user.save();

        // Award welcome badge to new user
        await assignWelcomeBadge(user);

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        // Check/Update missions
        user = await checkDailyMissions(user);

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /auth/google
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) return res.status(400).json({ error: 'Invalid token' });

        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });
        let isNewUser = false;
        if (!user) {
            user = new User({
                email,
                name,
                picture,
                googleId,
                dailyMissions: generateDailyMissions(),
                lastMissionDate: new Date()
            });
            await user.save();
            isNewUser = true;
        } else {
            user.name = name;
            user.picture = picture;
            // Check/Update missions
            user = await checkDailyMissions(user);
            await user.save();
        }

        // Award welcome badge to new Google users
        if (isNewUser) {
            await assignWelcomeBadge(user);
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// GET /auth/profile - Protected route
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // req.user is populated by middleware, but doesn't have the save method if it's a POJO?
        // middleware usually does User.findById...
        // Let's refetch to be safe and ensure we can save
        let user = await User.findById(req.user._id).populate('badges');
        if (!user) return res.status(404).json({ error: 'User not found' });

        user = await checkDailyMissions(user);
        res.json(user);
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT /auth/profile - Update profile (hostel, name, etc)
router.put('/profile', authMiddleware, async (req, res) => {
    const { name, hostel } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { name, hostel } },
            { new: true }
        ).populate('badges');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
