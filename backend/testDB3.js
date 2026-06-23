const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saap').then(async () => {
  const orders = await Order.find({ designImage: { $ne: null } }).lean();
  console.log(JSON.stringify(orders.map(o => o.designImage), null, 2));
  process.exit(0);
}).catch(console.error);
