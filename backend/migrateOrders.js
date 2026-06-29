const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('./models/Order');

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/saap_management');
    console.log('MongoDB Connected');

    const orders = await Order.find().sort({ createdAt: 1 });
    let sn = 1;
    for (const order of orders) {
      if (!order.serialNumber) {
        order.serialNumber = sn;
        await order.save();
        console.log(`Updated order ${order._id} with SN: ${sn}`);
      } else {
        sn = Math.max(sn, order.serialNumber);
      }
      sn++;
    }
    console.log(`Migration complete. Highest SN: ${sn - 1}`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

runMigration();
