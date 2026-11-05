const User = require('../models/User');
const Notification = require('../models/Notification');

const notifyAdmins = async ({ senderId, type = 'general', title, message, link = '' }) => {
  try {
    const admins = await User.find({ role: 'Admin' }).select('_id').lean();
    if (!admins || admins.length === 0) return;

    const senderStr = senderId ? senderId.toString() : '';
    const docs = admins
      .filter(admin => admin._id.toString() !== senderStr)
      .map(admin => ({
        recipient: admin._id,
        sender: senderId || admin._id,
        type,
        title,
        message,
        link,
        isRead: false,
      }));

    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } catch (error) {
    console.error('Error in notifyAdmins:', error.message);
  }
};

module.exports = notifyAdmins;

