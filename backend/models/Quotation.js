const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qtyPerItem: { type: String },
  totalQuantity: { type: String },
  price: { type: Number, default: 0 }
});

const quotationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  toAddress: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  items: [itemSchema],
  totalAmount: { type: Number, default: 0 },
  isDone: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quotation', quotationSchema);
