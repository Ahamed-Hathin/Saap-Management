const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // Optionally delete existing users, or just add an admin if none exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const adminUser = new User({
        name: 'Admin User',
        username: 'admin',
        password: 'password123',
        role: 'Admin',
        });
        await adminUser.save();
        console.log('Admin user created: username: admin, password: password123');
    } else {
        console.log('Admin user already exists');
    }
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
