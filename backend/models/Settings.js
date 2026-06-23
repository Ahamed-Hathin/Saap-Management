const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    jobTypes: {
      type: [String],
      default: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'],
    },
    printingCompanies: {
      type: [String],
      default: ['In-House', 'Partner A', 'Partner B', 'Other'],
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
