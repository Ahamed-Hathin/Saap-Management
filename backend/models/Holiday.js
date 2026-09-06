const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String, // format: 'YYYY-MM-DD'
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: 'Company Holiday',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Holiday = mongoose.model('Holiday', holidaySchema);
module.exports = Holiday;
