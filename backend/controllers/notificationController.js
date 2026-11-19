const Notification = require('../models/Notification');

const formatISTTime = (d) => {
  return new Date(d).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// @desc    Get all notifications for logged-in user (with optional date filters)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { filter, startDate, endDate, limit } = req.query;

    let query = { recipient: req.user._id };
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (filter === 'custom' && startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000+05:30`);
      const end = new Date(`${endDate}T23:59:59.999+05:30`);
      query.createdAt = { $gte: start, $lte: end };
    } else if (filter === 'today') {
      const startOfDay = new Date(`${todayStr}T00:00:00.000+05:30`);
      const endOfDay = new Date(`${todayStr}T23:59:59.999+05:30`);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (filter === 'yesterday') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const startOfYesterday = new Date(`${yesterdayStr}T00:00:00.000+05:30`);
      const endOfYesterday = new Date(`${yesterdayStr}T23:59:59.999+05:30`);
      query.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
    } else if (filter === 'this_week' || filter === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const startOfWeek = new Date(`${weekAgoStr}T00:00:00.000+05:30`);
      query.createdAt = { $gte: startOfWeek };
    } else if (filter === 'this_month' || filter === 'monthly') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const monthAgoStr = monthAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const startOfMonth = new Date(`${monthAgoStr}T00:00:00.000+05:30`);
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

    const rawNotifications = await notifQuery.lean();

    const notifications = rawNotifications.map((n) => {
      if (n.message && n.type === 'employee' && n.createdAt) {
        // Ensure any time in the message text is strictly formatted in IST
        const updatedMessage = n.message.replace(
          /\b(at\s+)\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?/i,
          (match, p1) => p1 + formatISTTime(n.createdAt)
        );
        return { ...n, message: updatedMessage };
      }
      return n;
    });

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

