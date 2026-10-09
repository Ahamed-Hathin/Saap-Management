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
    itemName: {
      type: String,
      required: false,
    },
    totalQty: {
      type: Number,
      required: false,
      default: 1,
    },
    pricePerQty: {
      type: Number,
      required: false,
      default: 0,
    },
    items: [
      {
        itemName: { type: String, required: true },
        totalQty: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true, default: 0 }
      }
    ],
  isClientOrder: {
    type: Boolean,
    default: false
  },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    balancePayments: [
      {
        amount: { type: Number, required: true },
        method: { type: String, enum: ['None', 'GPay', 'B-Gpay', 'KVB', 'Dtdc Wallet', 'Cash', 'Discount Amount', 'NEFT'], default: 'None' },
        date: { type: Date, default: Date.now },
        remarks: { type: String, default: '' }
      }
    ],
    designImage: {
      type: String,
      default: null,
    },
    invoiceImage: {
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
      enum: ['None', 'GPay', 'B-Gpay', 'KVB', 'Dtdc Wallet', 'Cash', 'Discount Amount', 'NEFT'],
      default: 'None',
    },
    printingCompany: {
      type: String,
      default: 'None',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ assignedEmployee: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ updatedAt: -1 });
orderSchema.index({ isClientOrder: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
