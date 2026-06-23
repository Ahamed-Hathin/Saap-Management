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
    } = req.body;

    let assignedEmployeeId = assignedEmployee;
    if (req.user.role === 'Employee' || !assignedEmployeeId) {
      assignedEmployeeId = req.user._id;
    }

    const isAdvanceReceived = paymentReceived !== undefined ? paymentReceived : advanceReceived;

    const order = new Order({
      clientName,
      mobileNumber,
      cardType,
      advanceAmount,
      totalAmount,
      assignedEmployee: assignedEmployeeId,
      advanceReceived: isAdvanceReceived,
      paymentMethod,
      printingCompany,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating order' });
  }
};

const getOrders = async (req, res) => {
  if (req.user.role === 'Admin') {
    const orders = await Order.find({}).sort({ updatedAt: -1 }).populate('assignedEmployee', 'name username');
    res.json(orders);
  } else {
    const orders = await Order.find({ assignedEmployee: req.user._id }).sort({ updatedAt: -1 }).populate('assignedEmployee', 'name username');
    res.json(orders);
  }
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('assignedEmployee', 'name username');

  if (order) {
    if (req.user.role === 'Admin' || order.assignedEmployee._id.toString() === req.user._id.toString()) {
      res.json(order);
    } else {
      res.status(401).json({ message: 'Not authorized to view this order' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (req.user.role === 'Admin' || order.assignedEmployee.toString() === req.user._id.toString()) {
      order.status = req.body.status || order.status;
      if (req.user.role === 'Admin') {
          order.advanceReceived = req.body.paymentReceived !== undefined ? req.body.paymentReceived : order.advanceReceived;
          order.paymentMethod = req.body.paymentMethod || order.paymentMethod;
          order.printingCompany = req.body.printingCompany || order.printingCompany;
      }
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
      order.status = 'Design Uploaded';
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
   if (req.user.role === 'Admin') {
     const totalOrders = await Order.countDocuments({});
     const activeOrders = await Order.countDocuments({ status: { $nin: ['Completed', 'Delivered'] }});
     const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
     const pendingPayments = await Order.countDocuments({ advanceReceived: false });
     const totalEmployees = await require('../models/User').countDocuments({ role: 'Employee' });

     res.json({ totalOrders, activeOrders, deliveredOrders, pendingPayments, totalEmployees });
   } else {
     const assignedOrders = await Order.countDocuments({ assignedEmployee: req.user._id });
     const completedOrders = await Order.countDocuments({ assignedEmployee: req.user._id, status: { $in: ['Completed', 'Delivered'] }});
     const pendingOrders = await Order.countDocuments({ assignedEmployee: req.user._id, status: { $nin: ['Completed', 'Delivered'] }});
     
     res.json({ assignedOrders, completedOrders, pendingOrders });
   }
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
