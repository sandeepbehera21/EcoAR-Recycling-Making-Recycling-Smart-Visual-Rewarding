// Seed script to create admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecoar_recycling';

// User Schema (matching your existing schema)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    picture: { type: String },
    googleId: { type: String },
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    weeklyScore: { type: Number, default: 0 },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    role: { type: String, default: 'user' },
    lastScanDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'admin@ecoar.com';
        const adminPassword = 'admin1234';

        // Check if admin exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            // Update existing admin password and role
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            admin.password = hashedPassword;
            admin.role = 'admin';
            admin.name = admin.name || 'Admin';
            await admin.save();
            console.log('✅ Admin user updated with new password');
        } else {
            // Create new admin
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            admin = new User({
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin',
                role: 'admin',
                points: 0
            });
            await admin.save();
            console.log('✅ Admin user created');
        }

        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('👤 Role: admin');

        await mongoose.disconnect();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedAdmin();
