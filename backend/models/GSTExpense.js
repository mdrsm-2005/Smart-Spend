const mongoose = require('mongoose');

const gstExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorName: {
    type: String,
    required: [true, 'Vendor Name is required'],
    trim: true
  },
  purchaseAmount: {
    type: Number,
    required: [true, 'Purchase Amount is required'],
    min: [0, 'Purchase Amount must be continuous positive number']
  },
  gstAmount: {
    type: Number,
    required: [true, 'GST Amount is required'],
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GSTExpense', gstExpenseSchema);
