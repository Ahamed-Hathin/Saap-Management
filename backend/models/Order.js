const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
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
      enum: [
        'Printing',
        'Cutting',
        'Ready To Dispatch',
        'Delivered',
      ],
      default: 'Printing',
    },
    advanceReceived: {
      type: Boolean,
      required: true,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['None', 'GPay', 'B-Gpay'],
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
