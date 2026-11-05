const Notification = require('../models/Notification');

// @desc    Get all notifications for logged-in user (with optional date filters)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { filter, startDate, endDate, limit } = req.query;

    let query = { recipient: req.user._id };
    const now = new Date();

    if (filter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    } else if (filter === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (filter === 'yesterday') {
      const startOfYesterday = new Date(now);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(now);
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      endOfYesterday.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
    } else if (filter === 'this_week' || filter === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfWeek };
    } else if (filter === 'this_month' || filter === 'monthly') {
      const startOfMonth = new Date(now);
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      startOfMonth.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfMonth };
    }

    let notifQuery = Notification.find(query)
      .populate('sender', 'name username')
      .sort({ createdAt: -1 });

    if (limit && Number(limit) > 0) {
      notifQuery = notifQuery.limit(Number(limit));
    } else if (!filter) {
      notifQuery = notifQuery.limit(50);
    }

    const notifications = await notifQuery.lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification count', error: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

// @desc    Mark all notifications as read for logged-in user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read', error: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

