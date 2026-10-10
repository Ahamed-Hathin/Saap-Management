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

const Order = require('../models/Order');

const getClientOrderQuery = (client) => {
  const rawMobile = client.mobileNumber ? client.mobileNumber.replace(/\D/g, '') : '';
  const formattedMobile = rawMobile.length > 5 ? `${rawMobile.slice(0, 5)} ${rawMobile.slice(5)}` : rawMobile;
  const nameRegex = client.clientName ? new RegExp(`^\\s*${client.clientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') : null;
  const usernameRegex = client.username ? new RegExp(`^\\s*${client.username.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') : null;

  const queryOr = [];
  if (nameRegex) queryOr.push({ clientName: nameRegex });
  if (usernameRegex) queryOr.push({ clientName: usernameRegex });
  if (rawMobile) queryOr.push({ mobileNumber: rawMobile });
  if (formattedMobile) queryOr.push({ mobileNumber: formattedMobile });
  if (client.mobileNumber) queryOr.push({ mobileNumber: client.mobileNumber });

  return queryOr.length > 0 ? { $or: queryOr } : {};
};

const getClients = async (req, res) => {
  try {
    const [clients, orders] = await Promise.all([
      Client.find({}).sort({ createdAt: -1 }).lean(),
      Order.find({}).select('clientName mobileNumber totalAmount advanceAmount balanceAmount balancePayments').lean()
    ]);

    // Pre-compile regex and match helpers for each client preserving exact rules
    const clientMatchHelpers = clients.map(client => {
      const rawMobile = client.mobileNumber ? client.mobileNumber.replace(/\D/g, '') : '';
      const formattedMobile = rawMobile.length > 5 ? `${rawMobile.slice(0, 5)} ${rawMobile.slice(5)}` : rawMobile;
      const nameRegex = client.clientName ? new RegExp(`^\\s*${client.clientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') : null;
      const usernameRegex = client.username ? new RegExp(`^\\s*${client.username.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') : null;

      return {
        client,
        matches: (order) => {
          if (nameRegex && order.clientName && nameRegex.test(order.clientName)) return true;
          if (usernameRegex && order.clientName && usernameRegex.test(order.clientName)) return true;
          if (rawMobile && order.mobileNumber === rawMobile) return true;
          if (formattedMobile && order.mobileNumber === formattedMobile) return true;
          if (client.mobileNumber && order.mobileNumber === client.mobileNumber) return true;
          return false;
        }
      };
    });

    const clientsWithBalance = clientMatchHelpers.map(({ client, matches }) => {
      let totalBilled = 0;
      let totalPaid = 0;

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        if (matches(order)) {
          totalBilled += (order.totalAmount || 0);
          let bpTotal = 0;
          if (order.balancePayments && Array.isArray(order.balancePayments)) {
            for (let j = 0; j < order.balancePayments.length; j++) {
              bpTotal += (Number(order.balancePayments[j].amount) || 0);
            }
          }
          let balancePaid = Math.max(Number(order.balanceAmount) || 0, bpTotal);
          let orderPaid = (Number(order.advanceAmount) || 0) + balancePaid;
          totalPaid += orderPaid;
        }
      }

      const pendingBalance = totalBilled - totalPaid;
      return {
        ...client,
        pendingBalance: pendingBalance > 0 ? pendingBalance : 0
      };
    });

    res.json(clientsWithBalance);
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
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { clientName: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).lean();
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

const sanitizePaymentHistory = (historyList) => {
  if (!historyList || !Array.isArray(historyList) || historyList.length === 0) {
    return [];
  }

  const getLocalDateKey = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'unknown';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const byDate = new Map();

  historyList.forEach((item, idx) => {
    const rawDate = item.date ? new Date(item.date) : new Date();
    const d = isNaN(rawDate.getTime()) ? new Date() : rawDate;
    const dateKey = getLocalDateKey(d);
    const amount = Number(item.amount) || 0;
    if (amount <= 0) return;

    let method = (item.method || '').trim();
    if (method.toLowerCase() === 'none') {
      method = '';
    }

    const remarks = (item.remarks !== undefined && item.remarks !== null)
      ? String(item.remarks).trim()
      : (item.remark ? String(item.remark).trim() : '');

    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey).push({
      _id: item._id,
      date: d,
      amount,
      method,
      remarks
    });
  });

  const result = [];

  byDate.forEach((items, dateKey) => {
    const validMethod = items.find(i => i.method && i.method.toLowerCase() !== 'none')?.method || 'Cash';
    const customRemark = items.find(i => i.remarks && i.remarks.toLowerCase() !== 'pay all')?.remarks;

    const mergedMap = new Map();

    items.forEach((item) => {
      const finalMethod = item.method || validMethod;
      const finalRemarks = item.remarks || customRemark || '';
      const key = `${finalMethod}___${finalRemarks}`;

      if (mergedMap.has(key)) {
        mergedMap.get(key).amount += item.amount;
        if (new Date(item.date) > new Date(mergedMap.get(key).date)) {
          mergedMap.get(key).date = item.date;
        }
      } else {
        mergedMap.set(key, {
          _id: item._id,
          date: item.date,
          amount: item.amount,
          method: finalMethod,
          remarks: finalRemarks
        });
      }
    });

    mergedMap.forEach(mergedItem => {
      result.push(mergedItem);
    });
  });

  return result.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const getClientOrders = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const orders = await Order.find(getClientOrderQuery(client)).sort({ createdAt: -1 });

    let totalBilled = 0;
    let totalPaid = 0;

    orders.forEach(order => {
      totalBilled += (order.totalAmount || 0);
      let bpTotal = 0;
      if (order.balancePayments && Array.isArray(order.balancePayments)) {
        order.balancePayments.forEach(bp => {
          bpTotal += (Number(bp.amount) || 0);
        });
      }
      let balancePaid = Math.max(Number(order.balanceAmount) || 0, bpTotal);
      let orderPaid = (Number(order.advanceAmount) || 0) + balancePaid;
      totalPaid += orderPaid;
    });

    const pendingBalance = totalBilled - totalPaid;

    if (!client.paymentHistory || client.paymentHistory.length === 0) {
      const orderPayments = [];
      orders.forEach(order => {
        if (order.balancePayments && Array.isArray(order.balancePayments)) {
          order.balancePayments.forEach(bp => {
            const bpAmt = Number(bp.amount) || 0;
            if (bpAmt > 0) {
              const d = new Date(bp.date || order.updatedAt || order.createdAt);
              const methodKey = (bp.method && bp.method !== 'None') ? bp.method : (order.paymentMethod && order.paymentMethod !== 'None' ? order.paymentMethod : '');
              const remarkKey = bp.remarks || bp.remark || order.remarks || '';
              orderPayments.push({
                amount: bpAmt,
                method: methodKey,
                date: d,
                remarks: remarkKey
              });
            }
          });
        }
      });
      if (orderPayments.length > 0) {
        client.paymentHistory = sanitizePaymentHistory(orderPayments);
        await client.save();
      }
    } else {
      client.paymentHistory = sanitizePaymentHistory(client.paymentHistory);
      await client.save();
    }

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

    const { payments, paymentMethod, remarks, remark } = req.body;
    const paymentRemark = remarks !== undefined ? String(remarks).trim() : (remark !== undefined ? String(remark).trim() : '');
    
    let remainingPayments = payments ? [...payments] : [{ amount: Number.MAX_SAFE_INTEGER, method: paymentMethod || 'Cash' }];

    const orders = await Order.find(getClientOrderQuery(client)).sort({ createdAt: 1 }); // Sort oldest first so they get paid first

    let totalPaidNow = 0;

    for (const order of orders) {
      let bpTotal = 0;
      if (order.balancePayments && Array.isArray(order.balancePayments)) {
        order.balancePayments.forEach(bp => {
          bpTotal += (Number(bp.amount) || 0);
        });
      }
      let balancePaid = Math.max(Number(order.balanceAmount) || 0, bpTotal);
      let orderPaid = (Number(order.advanceAmount) || 0) + balancePaid;
      
      let pendingAmount = Math.max(0, (Number(order.totalAmount) || 0) - orderPaid);

      if (pendingAmount > 0) {
        if (!order.balancePayments) order.balancePayments = [];
        
        while (pendingAmount > 0 && remainingPayments.length > 0) {
          let currentPayment = remainingPayments[0];
          let paymentAmount = Math.min(pendingAmount, currentPayment.amount);
          
          if (paymentAmount > 0) {
            order.balancePayments.push({
              amount: paymentAmount,
              date: new Date(),
              method: (currentPayment.method && currentPayment.method !== 'None') ? currentPayment.method : (paymentMethod || 'Cash'),
              remarks: currentPayment.remarks !== undefined ? currentPayment.remarks : paymentRemark
            });
            order.balanceAmount = (order.balanceAmount || 0) + paymentAmount;
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

    // Record Pay All in client.paymentHistory
    if (!client.paymentHistory) {
      client.paymentHistory = [];
    }
    const paymentDate = new Date();
    if (payments && Array.isArray(payments) && payments.length > 0) {
      payments.forEach(p => {
        const amt = Number(p.amount) || 0;
        if (amt > 0) {
          const itemMethod = (p.method && p.method !== 'None') ? p.method : (paymentMethod && paymentMethod !== 'None' ? paymentMethod : 'Cash');
          const itemRemark = p.remarks !== undefined ? String(p.remarks).trim() : paymentRemark;
          client.paymentHistory.push({
            amount: amt,
            method: itemMethod,
            date: paymentDate,
            remarks: itemRemark
          });
        }
      });
    } else if (totalPaidNow > 0) {
      const chosenMethod = (paymentMethod && paymentMethod !== 'None') ? paymentMethod : 'Cash';
      client.paymentHistory.push({
        amount: totalPaidNow,
        method: chosenMethod,
        date: paymentDate,
        remarks: paymentRemark
      });
    }

    client.paymentHistory = sanitizePaymentHistory(client.paymentHistory);
    await client.save();

    res.json({ message: 'Payments cleared successfully', totalPaidNow, paymentHistory: client.paymentHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createClient, getClients, searchClients, updateClient, deleteClient, getClientOrders, payAllClientOrders };
