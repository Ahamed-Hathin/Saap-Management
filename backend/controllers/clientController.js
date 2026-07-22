const Client = require('../models/Client');

const createClient = async (req, res) => {
  try {
    const { username, clientName, mobileNumber } = req.body;

    const existingClient = await Client.findOne({ username: username.toLowerCase() });
    if (existingClient) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const client = new Client({
      username,
      clientName,
      mobileNumber,
    });

    const createdClient = await client.save();
    res.status(201).json(createdClient);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating client' });
  }
};

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const clients = await Client.find({
      username: { $regex: q, $options: 'i' },
    }).limit(10);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateClient = async (req, res) => {
  try {
    const { username, clientName, mobileNumber } = req.body;
    const client = await Client.findById(req.params.id);

    if (client) {
      if (username && username.toLowerCase() !== client.username) {
        const existingClient = await Client.findOne({ username: username.toLowerCase() });
        if (existingClient) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        client.username = username;
      }
      if (clientName) client.clientName = clientName;
      if (mobileNumber) client.mobileNumber = mobileNumber;

      const updatedClient = await client.save();
      res.json(updatedClient);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating client' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (client) {
      res.json({ message: 'Client removed' });
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const Order = require('../models/Order');

const getClientOrders = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const rawMobile = client.mobileNumber.replace(/\\D/g, '');
    const formattedMobile = rawMobile.length > 5 ? `${rawMobile.slice(0, 5)} ${rawMobile.slice(5)}` : rawMobile;

    const orders = await Order.find({
      clientName: { $regex: new RegExp(`^${client.clientName.trim().replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') },
      $or: [
        { mobileNumber: rawMobile },
        { mobileNumber: formattedMobile },
        { mobileNumber: client.mobileNumber }
      ]
    }).sort({ createdAt: -1 });

    let totalBilled = 0;
    let totalPaid = 0;

    orders.forEach(order => {
      totalBilled += (order.totalAmount || 0);
      let orderPaid = order.advanceAmount || 0;
      if (order.balancePayments && Array.isArray(order.balancePayments)) {
        order.balancePayments.forEach(bp => {
          orderPaid += (bp.amount || 0);
        });
      }
      totalPaid += orderPaid;
    });

    const pendingBalance = totalBilled - totalPaid;

    res.json({
      client,
      summary: {
        totalOrders: orders.length,
        totalBilled,
        totalPaid,
        pendingBalance: pendingBalance > 0 ? pendingBalance : 0
      },
      orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const payAllClientOrders = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { payments, paymentMethod } = req.body;
    
    // If the legacy paymentMethod was passed, convert it to a split format that is basically "take whatever is pending"
    // Wait, with the new UI, we always send `payments: [{amount: X, method: Y}]`
    // If they just submitted the form, we loop through payments and distribute them.
    let remainingPayments = payments ? [...payments] : [{ amount: Number.MAX_SAFE_INTEGER, method: paymentMethod || 'Cash' }];

    const rawMobile = client.mobileNumber.replace(/\D/g, '');
    const formattedMobile = rawMobile.length > 5 ? `${rawMobile.slice(0, 5)} ${rawMobile.slice(5)}` : rawMobile;

    const orders = await Order.find({
      clientName: { $regex: new RegExp(`^${client.clientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      $or: [
        { mobileNumber: rawMobile },
        { mobileNumber: formattedMobile },
        { mobileNumber: client.mobileNumber }
      ]
    }).sort({ createdAt: 1 }); // Sort oldest first so they get paid first

    let totalPaidNow = 0;

    for (const order of orders) {
      let orderPaid = order.advanceAmount || 0;
      if (order.balancePayments && Array.isArray(order.balancePayments)) {
        order.balancePayments.forEach(bp => {
          orderPaid += (bp.amount || 0);
        });
      }
      
      let pendingAmount = (order.totalAmount || 0) - orderPaid;

      if (pendingAmount > 0) {
        if (!order.balancePayments) order.balancePayments = [];
        
        while (pendingAmount > 0 && remainingPayments.length > 0) {
          let currentPayment = remainingPayments[0];
          let paymentAmount = Math.min(pendingAmount, currentPayment.amount);
          
          if (paymentAmount > 0) {
            order.balancePayments.push({
              amount: paymentAmount,
              date: new Date(),
              paymentMethod: currentPayment.method
            });
            pendingAmount -= paymentAmount;
            currentPayment.amount -= paymentAmount;
            totalPaidNow += paymentAmount;
          }
          
          if (currentPayment.amount <= 0) {
            remainingPayments.shift();
          }
        }
        
        await order.save();
      }
      
      if (remainingPayments.length === 0) {
        break; // All payments have been distributed
      }
    }

    res.json({ message: 'Payments cleared successfully', totalPaidNow });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createClient, getClients, searchClients, updateClient, deleteClient, getClientOrders, payAllClientOrders };
