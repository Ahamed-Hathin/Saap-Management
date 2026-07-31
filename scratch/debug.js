const mongoose = require('mongoose');
require('dotenv').config({ path: '../../backend/.env' });
const Client = require('../../backend/models/Client');
const Order = require('../../backend/models/Order');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saap', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to DB');
  const client = await Client.findOne({ clientName: /Vinayaga Bags/i });
  console.log('Client:', client);
  
  if (client) {
    const ordersByName = await Order.find({ clientName: /Vinayaga Bags/i });
    console.log('Orders by name:', ordersByName.length, ordersByName.map(o => ({ name: o.clientName, mobile: o.mobileNumber })));
  }
  
  mongoose.connection.close();
}).catch(err => {
  console.error(err);
});
