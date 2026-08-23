const mongoose = require('mongoose');

const salarySettingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    salaryPerDay: {
      type: Number,
      required: true,
      default: 0,
    },
    hoursPerDay: {
      type: Number,
      required: true,
      default: 8,
    },
    workingDaysPerMonth: {
      type: Number,
      required: true,
      default: 26,
    },
  },
  {
    timestamps: true,
  }
);

const SalarySetting = mongoose.model('SalarySetting', salarySettingSchema);
module.exports = SalarySetting;
