const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    jobTypes: {
      type: [String],
      default: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'],
    },
    printingCompanies: {
      type: [String],
      default: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'],
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
