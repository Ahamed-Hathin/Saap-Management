const mongoose = require('mongoose');

const clientSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        method: { type: String, default: 'Cash' },
        date: { type: Date, default: Date.now },
        remarks: { type: String, default: '' },
      }
    ],
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ clientName: 1 });
clientSchema.index({ mobileNumber: 1 });

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
