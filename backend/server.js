const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        username: 'admin',
        password: 'password123',
        role: 'Admin',
      });
      await adminUser.save();
      console.log('✅ Admin user automatically seeded: username: admin, password: password123');
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
};

seedAdmin();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({ message: err.message || 'Server Error', error: err });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
