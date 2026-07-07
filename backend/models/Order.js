const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      unique: true
    },
    clientName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    cardType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    advanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    balancePayments: [
      {
        amount: { type: Number, required: true },
        method: { type: String, enum: ['None', 'GPay', 'B-Gpay', 'KVB', 'Dtdc Wallet', 'Cash', 'Discount Amount'], default: 'None' },
        date: { type: Date, default: Date.now }
      }
    ],
    designImage: {
      type: String,
      default: null,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      required: true,
      default: 'Printing',
    },
    advanceReceived: {
      type: Boolean,
      required: true,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['None', 'GPay', 'B-Gpay', 'KVB', 'Dtdc Wallet', 'Cash', 'Discount Amount'],
      default: 'None',
    },
    printingCompany: {
      type: String,
      default: 'None',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
