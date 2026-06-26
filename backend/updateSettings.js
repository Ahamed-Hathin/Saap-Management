const mongoose = require('mongoose');
require('dotenv').config();
const Settings = require('./models/Settings');

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.printingCompanies = ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'];
    await settings.save();
    console.log('Settings updated successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

update();
