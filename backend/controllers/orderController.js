const Order = require('../models/Order');

const createOrder = async (req, res) => {
  try {
    const {
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
      order.status = req.body.status || order.status;
      order.advanceReceived = req.body.paymentReceived !== undefined ? req.body.paymentReceived : order.advanceReceived;
      order.advanceAmount = req.body.advanceAmount !== undefined ? req.body.advanceAmount : order.advanceAmount;
      order.balanceAmount = req.body.balanceAmount !== undefined ? req.body.balanceAmount : order.balanceAmount;
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

   res.json({ totalOrders, pendingOrders, readyToDispatch, pendingPayments, deliveredOrders });
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
