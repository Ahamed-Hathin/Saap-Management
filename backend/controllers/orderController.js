const Order = require('../models/Order');
const Expense = require('../models/Expense');

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
      itemName,
      totalQty,
      pricePerQty,
      items,
      isClientOrder,
      status,
      remarks,
    } = req.body;

    if (clientName) {
      clientName = clientName.charAt(0).toUpperCase() + clientName.slice(1);
    }

    let assignedEmployeeId = assignedEmployee;
    if (req.user.role === 'Employee' || !assignedEmployeeId) {
      assignedEmployeeId = req.user._id;
    }

    const isAdvanceReceived = paymentReceived !== undefined ? paymentReceived : advanceReceived;

    const numAdvanceAmount = (advanceAmount === '' || advanceAmount === null || advanceAmount === undefined || isNaN(Number(advanceAmount))) ? 0 : Number(advanceAmount);
    const numTotalAmount = (totalAmount === '' || totalAmount === null || totalAmount === undefined || isNaN(Number(totalAmount))) ? 0 : Number(totalAmount);
    const numBalanceAmount = (req.body.balanceAmount === '' || req.body.balanceAmount === null || req.body.balanceAmount === undefined || isNaN(Number(req.body.balanceAmount))) ? 0 : Number(req.body.balanceAmount);

    const maxOrder = await Order.findOne({}, {}, { sort: { 'serialNumber' : -1 } });
    const nextSerialNumber = maxOrder && maxOrder.serialNumber ? maxOrder.serialNumber + 1 : 1;

    const order = new Order({
      serialNumber: nextSerialNumber,
      clientName,
      mobileNumber,
      cardType,
      advanceAmount: numAdvanceAmount,
      totalAmount: numTotalAmount,
      balanceAmount: numBalanceAmount,
      assignedEmployee: assignedEmployeeId,
      advanceReceived: isAdvanceReceived,
      paymentMethod,
      printingCompany,
      itemName,
      totalQty,
      pricePerQty,
      items: Array.isArray(items) ? items : [],
      isClientOrder: isClientOrder || false,
      remarks: remarks || '',
      ...(status ? { status } : {}),
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating order' });
  }
};

const getOrders = async (req, res) => {
  if (req.user.role === 'Admin') {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('assignedEmployee', 'name username').lean();
    res.json(orders);
  } else {
    if (req.query.employeeId) {
      const orders = await Order.find({ assignedEmployee: req.query.employeeId }).sort({ createdAt: -1 }).populate('assignedEmployee', 'name username').lean();
      return res.json(orders);
    }
    const orders = await Order.find({ assignedEmployee: req.user._id }).sort({ createdAt: -1 }).populate('assignedEmployee', 'name username').lean();
    res.json(orders);
  }
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('assignedEmployee', 'name username').lean();

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
      if (req.body.itemName !== undefined) order.itemName = req.body.itemName;
      if (req.body.totalQty !== undefined) order.totalQty = req.body.totalQty;
      if (req.body.pricePerQty !== undefined) order.pricePerQty = req.body.pricePerQty;
      if (req.body.items !== undefined) order.items = req.body.items;
      if (req.body.remarks !== undefined) order.remarks = req.body.remarks;
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

   if (startDate && endDate && (filter === 'custom' || filter === 'today' || filter === 'yesterday' || filter === 'weekly' || filter === 'monthly')) {
     dateFilter = { updatedAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
   } else if (filter === 'today') {
     const startOfDay = new Date(now.setHours(0, 0, 0, 0));
     const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
     dateFilter = { updatedAt: { $gte: startOfDay, $lte: endOfDay } };
   } else if (filter === 'yesterday') {
     const yesterday = new Date(now);
     yesterday.setDate(yesterday.getDate() - 1);
     const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
     const endOfYesterday = new Date(new Date(yesterday).setHours(23, 59, 59, 999));
     dateFilter = { updatedAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
   } else if (filter === 'weekly') {
     const startOfWeek = new Date(now);
     startOfWeek.setDate(now.getDate() - 7);
     startOfWeek.setHours(0, 0, 0, 0);
     dateFilter = { updatedAt: { $gte: startOfWeek } };
   } else if (filter === 'monthly') {
     const startOfMonth = new Date(now);
     startOfMonth.setDate(now.getDate() - 30);
     startOfMonth.setHours(0, 0, 0, 0);
     dateFilter = { updatedAt: { $gte: startOfMonth } };
   }

   let expenseFilter = {};
   if (dateFilter.updatedAt) {
     expenseFilter.updatedAt = dateFilter.updatedAt;
   }

   let baseQuery = { ...dateFilter };
   if (req.user.role !== 'Admin') {
     baseQuery.assignedEmployee = req.user._id;
   }

   // Execute independent queries in parallel with lean()
   const [
     totalOrders,
     pendingOrders,
     readyToDispatch,
     pendingPayments,
     deliveredOrders,
     ordersForRevenue,
     chartDataRaw,
     recentOrders,
     expenses
   ] = await Promise.all([
     Order.countDocuments(baseQuery),
     Order.countDocuments({ ...baseQuery, status: { $nin: ['Delivered', 'Ready To Dispatch'] } }),
     Order.countDocuments({ ...baseQuery, status: 'Ready To Dispatch' }),
     Order.countDocuments({ 
       ...baseQuery, 
       totalAmount: { $gt: 0 },
       $expr: { 
         $lt: [
           { $add: [ { $ifNull: ["$advanceAmount", 0] }, { $ifNull: ["$balanceAmount", 0] } ] }, 
           { $ifNull: ["$totalAmount", 0] }
         ] 
       }
     }),
     Order.countDocuments({ ...baseQuery, status: 'Delivered' }),
     Order.find(baseQuery, 'totalAmount advanceAmount paymentMethod balancePayments createdAt').lean(),
     Order.aggregate([
       { $match: baseQuery },
       {
         $group: {
           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
           orders: { $sum: 1 },
           revenue: { $sum: "$totalAmount" }
         }
       },
       { $sort: { _id: 1 } }
     ]),
     Order.find(baseQuery)
       .sort({ createdAt: -1 })
       .limit(5)
       .populate('assignedEmployee', 'name')
       .lean(),
     Expense.find(expenseFilter).lean()
   ]);
   let totalExpense = 0;
   let expenseBreakdown = {};
   
   const start = dateFilter.updatedAt?.$gte;
   const end = dateFilter.updatedAt?.$lte;

   expenses.forEach(expense => {
     let expenseDate = new Date(expense.createdAt || expense.date);
     let isMainInFilter = true;
     if (start && end) {
       isMainInFilter = expenseDate >= start && expenseDate <= end;
     } else if (start) {
       isMainInFilter = expenseDate >= start;
     }

     if (isMainInFilter) {
       totalExpense += (expense.amount || 0);
       expenseBreakdown[expense.name] = (expenseBreakdown[expense.name] || 0) + (expense.amount || 0);
     }

     if (expense.balancePayments && Array.isArray(expense.balancePayments)) {
       expense.balancePayments.forEach(bp => {
         let bpDate = new Date(bp.date || expense.updatedAt);
         let isBpInFilter = true;
         if (start && end) {
           isBpInFilter = bpDate >= start && bpDate <= end;
         } else if (start) {
           isBpInFilter = bpDate >= start;
         }
         
         if (isBpInFilter) {
           totalExpense += (bp.amount || 0);
           expenseBreakdown[expense.name] = (expenseBreakdown[expense.name] || 0) + (bp.amount || 0);
         }
       });
     }
   });

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
     expenseBreakdown,
     chartData,
     recentOrders,
     totalExpense
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

const uploadInvoiceImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const order = await Order.findById(req.params.id);
    if (order) {
      order.invoiceImage = req.file.path;
      await order.save();
    }
    res.json({
      message: 'Invoice image uploaded successfully',
      imageUrl: req.file.path,
      invoiceImage: req.file.path,
    });
  } catch (error) {
    console.error('Upload Invoice Error:', error);
    res.status(500).json({ message: 'Server error during invoice upload' });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, uploadDesignImage, uploadInvoiceImage, getDashboardStats, deleteOrder };
