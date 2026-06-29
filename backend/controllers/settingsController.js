const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json(settings);
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }

  settings.jobTypes = req.body.jobTypes || settings.jobTypes;
  settings.printingCompanies = req.body.printingCompanies || settings.printingCompanies;
  settings.orderStatuses = req.body.orderStatuses || settings.orderStatuses;

  const updatedSettings = await settings.save();
  res.json(updatedSettings);
};

module.exports = { getSettings, updateSettings };
