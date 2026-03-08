const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be a positive number']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    sparse: true,
    index: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'NetBanking', 'Other'],
    default: 'Cash'
  },
  source: {
    type: String,
    default: 'Manual'
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
