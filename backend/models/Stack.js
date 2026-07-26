const mongoose = require('mongoose');

const stackSchema = mongoose.Schema(
  {
    modelNumber: {
      type: String,
      required: true,
      unique: true,
    },
    sizeA: {
      type: Number,
      required: true,
      default: 0,
    },
    sizeB: {
      type: Number,
      required: true,
      default: 0,
    },
    sizeC: {
      type: Number,
      required: true,
      default: 0,
    },
    totalStack: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Stack = mongoose.model('Stack', stackSchema);
module.exports = Stack;
