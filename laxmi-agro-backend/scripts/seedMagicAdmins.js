require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const ADMIN_USERS = [
    { name: 'Abhinav Pandey', email: 'abhinavpandey12201@gmail.com' },
    { name: 'Mayur Khatwani', email: 'mayurkhatwani5@gmail.com' },
];

const seedMagicAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const { name, email } of ADMIN_USERS) {
            const existing = await User.findOne({ email });

            if (existing) {
                if (existing.role !== 'admin' || !existing.isActive) {
                    existing.role = 'admin';
                    existing.isActive = true;
                    await existing.save();
                    console.log(`Updated existing user to active admin: ${email}`);
                } else {
                    console.log(`Admin already exists: ${email}`);
                }
                continue;
            }

            await User.create({
                name,
                email,
                authProvider: 'email',
                role: 'admin',
                isActive: true,
            });
            console.log(`Admin user created: ${email}`);
        }

        console.log('Magic link admins seeded successfully.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding magic link admins:', error);
        process.exit(1);
    }
};

seedMagicAdmins();
