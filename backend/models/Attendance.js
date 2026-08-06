const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    lunchStart: {
      type: Date,
    },
    lunchEnd: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    lunchDuration: {
      type: Number,
      default: 0,
    },
    workingMinutes: {
      type: Number,
      default: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'Not Checked In',
        'Working',
        'Lunch Break',
        'Working After Lunch',
        'Checked Out',
        'Late',
        'Completed',
        'Early Exit',
        'Absent'
      ],
      default: 'Not Checked In',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyExit: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
