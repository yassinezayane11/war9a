require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/war9atn';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log(`Admin already exists: phone=${existing.phone}`);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin War9a',
    phone: '12345678',
    password: 'admin123',
    role: 'admin',
    balance: 0
  });

  console.log('✅ Admin created!');
  console.log(`   Phone: ${admin.phone}`);
  console.log(`   Password: admin123`);
  console.log(`   IMPORTANT: Change the password after first login!`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
