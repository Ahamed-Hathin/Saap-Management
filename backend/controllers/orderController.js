const Order = require('../models/Order');

const createOrder = async (req, res) => {
  try {
    let {
      clientName,
      mobileNumber,
      cardType,
      advanceAmount,
      totalAmount,
      assignedEmployee,
      paymentReceived,
      advanceReceived,
      paymentMethod,
      printingCompany,
      description,
    } = req.body;

    if (clientName) {
      clientName = clientName.charAt(0).toUpperCase() + clientName.slice(1);
    }

    let assignedEmployeeId = assignedEmployee;
    if (req.user.role === 'Employee' || !assignedEmployeeId) {
      assignedEmployeeId = req.user._id;
    }

    const isAdvanceReceived = paymentReceived !== undefined ? paymentReceived : advanceReceived;

    const maxOrder = await Order.findOne({}, {}, { sort: { 'serialNumber' : -1 } });
    const nextSerialNumber = maxOrder && maxOrder.serialNumber ? maxOrder.serialNumber + 1 : 1;

    const order = new Order({
      serialNumber: nextSerialNumber,
      clientName,
      mobileNumber,
      cardType,
      advanceAmount,
      totalAmount,
      assignedEmployee: assignedEmployeeId,
      advanceReceived: isAdvanceReceived,
      paymentMethod,
      printingCompany,
      description,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating order' });
  }
};

const getOrders = async (req, res) => {
  if (req.user.role === 'Admin') {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('assignedEmployee', 'name username');
    res.json(orders);
  } else {
    if (req.query.employeeId) {
      const orders = await Order.find({ assignedEmployee: req.query.employeeId }).sort({ createdAt: -1 }).populate('assignedEmployee', 'name username');
      return res.json(orders);
    }
    const orders = await Order.find({ assignedEmployee: req.user._id }).sort({ createdAt: -1 }).populate('assignedEmployee', 'name username');
    res.json(orders);
  }
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('assignedEmployee', 'name username');

  if (order) {
    if (req.user.role === 'Admin' || req.user.role === 'Employee') {
      res.json(order);
    } else {
      res.status(401).json({ message: 'Not authorized to view this order' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('assignedEmployee');

  if (order) {
    if (req.user.role === 'Admin' || req.user.role === 'Employee') {
      if (req.body.clientName) {
        order.clientName = req.body.clientName.charAt(0).toUpperCase() + req.body.clientName.slice(1);
      }
      order.mobileNumber = req.body.mobileNumber || order.mobileNumber;
      order.cardType = req.body.cardType || order.cardType;
      order.description = req.body.description !== undefined ? req.body.description : order.description;
      order.status = req.body.status || order.status;
      order.advanceReceived = req.body.paymentReceived !== undefined ? req.body.paymentReceived : order.advanceReceived;
      order.advanceAmount = req.body.advanceAmount !== undefined ? req.body.advanceAmount : order.advanceAmount;
      
      if (req.body.newBalancePayments && Array.isArray(req.body.newBalancePayments)) {
        if (!order.balancePayments) order.balancePayments = [];
        order.balancePayments.push(...req.body.newBalancePayments);
        const sumNew = req.body.newBalancePayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        order.balanceAmount = (order.balanceAmount || 0) + sumNew;
      } else if (req.body.balanceAmount !== undefined) {
        order.balanceAmount = req.body.balanceAmount;
      }

      order.totalAmount = req.body.totalAmount !== undefined ? req.body.totalAmount : order.totalAmount;
      order.paymentMethod = req.body.paymentMethod || order.paymentMethod;
      order.printingCompany = req.body.printingCompany || order.printingCompany;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(401).json({ message: 'Not authorized to update this order' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const uploadDesignImage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      order.designImage = req.file.path;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

const getDashboardStats = async (req, res) => {
   const { filter, startDate, endDate } = req.query;

   let dateFilter = {};
   const now = new Date();

   if (filter === 'today') {
     const startOfDay = new Date(now.setHours(0, 0, 0, 0));
     const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
     dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
   } else if (filter === 'weekly') {
     const startOfWeek = new Date(now);
     startOfWeek.setDate(now.getDate() - 7);
     startOfWeek.setHours(0, 0, 0, 0);
     dateFilter = { createdAt: { $gte: startOfWeek } };
   } else if (filter === 'monthly') {
     const startOfMonth = new Date(now);
     startOfMonth.setDate(now.getDate() - 30);
     startOfMonth.setHours(0, 0, 0, 0);
     dateFilter = { createdAt: { $gte: startOfMonth } };
   } else if (filter === 'custom' && startDate && endDate) {
     const start = new Date(startDate);
     start.setHours(0, 0, 0, 0);
     const end = new Date(endDate);
     end.setHours(23, 59, 59, 999);
     dateFilter = { createdAt: { $gte: start, $lte: end } };
   }

   let baseQuery = { ...dateFilter };
   if (req.user.role !== 'Admin') {
     baseQuery.assignedEmployee = req.user._id;
   }

   const totalOrders = await Order.countDocuments(baseQuery);
   const pendingOrders = await Order.countDocuments({ ...baseQuery, status: { $ne: 'Delivered' } });
   const readyToDispatch = await Order.countDocuments({ ...baseQuery, status: 'Ready To Dispatch' });
   const pendingPayments = await Order.countDocuments({ 
     ...baseQuery, 
     totalAmount: { $gt: 0 },
     $expr: { 
       $lt: [
         { $add: [ { $ifNull: ["$advanceAmount", 0] }, { $ifNull: ["$balanceAmount", 0] } ] }, 
         { $ifNull: ["$totalAmount", 0] }
       ] 
     }
   });
   const deliveredOrders = await Order.countDocuments({ ...baseQuery, status: 'Delivered' });

   const ordersForRevenue = await Order.find(baseQuery, 'totalAmount advanceAmount paymentMethod balancePayments');

   let totalRevenue = 0;
   let collectedRevenue = 0;
   let pendingRevenue = 0;
   let paymentBreakdown = {
     'GPay': 0,
     'B-Gpay': 0,
     'KVB': 0,
     'Dtdc Wallet': 0,
     'Cash': 0,
     'Discount Amount': 0
   };

   ordersForRevenue.forEach(order => {
     totalRevenue += (order.totalAmount || 0);
     
     let orderCollected = 0;
     let orderDiscount = 0;
     
     const adv = order.advanceAmount || 0;
     if (adv > 0) {
       if (order.paymentMethod === 'Discount Amount') {
         orderDiscount += adv;
       } else {
         orderCollected += adv;
         const method = (order.paymentMethod && order.paymentMethod !== 'None') ? order.paymentMethod : 'Cash';
         paymentBreakdown[method] = (paymentBreakdown[method] || 0) + adv;
       }
     }

     if (order.balancePayments && Array.isArray(order.balancePayments)) {
       order.balancePayments.forEach(bp => {
         const bpAmt = Number(bp.amount) || 0;
         if (bpAmt > 0) {
           if (bp.method === 'Discount Amount') {
             orderDiscount += bpAmt;
           } else {
             orderCollected += bpAmt;
             const method = (bp.method && bp.method !== 'None') ? bp.method : 'Cash';
             paymentBreakdown[method] = (paymentBreakdown[method] || 0) + bpAmt;
           }
         }
       });
     }

     collectedRevenue += orderCollected;
     
     // Pending amount for this order (cannot be negative)
     const orderPending = Math.max(0, (order.totalAmount || 0) - orderCollected - orderDiscount);
     pendingRevenue += orderPending;
   });

   // Chart Data Generation
   const chartDataRaw = await Order.aggregate([
     { $match: baseQuery },
     {
       $group: {
         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
         orders: { $sum: 1 },
         revenue: { $sum: "$totalAmount" }
       }
     },
     { $sort: { _id: 1 } }
   ]);

   const chartData = chartDataRaw.map(item => ({
     date: item._id,
     orders: item.orders,
     revenue: item.revenue
   }));

   const recentOrders = await Order.find(baseQuery)
     .sort({ createdAt: -1 })
     .limit(5)
     .populate('assignedEmployee', 'name');

   res.json({ 
     totalOrders, 
     pendingOrders, 
     readyToDispatch, 
     pendingPayments, 
     deliveredOrders,
     totalRevenue,
     collectedRevenue,
     pendingRevenue,
     paymentBreakdown,
     chartData,
     recentOrders
   });
};

const deleteOrder = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(401).json({ message: 'Not authorized to delete this order' });
    }
    const order = await Order.findByIdAndDelete(req.params.id);
    if (order) {
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, uploadDesignImage, getDashboardStats, deleteOrder };
