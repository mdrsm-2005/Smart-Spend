const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Amount must be a positive number']
  },
  month: {
    type: String, // Format: YYYY-MM
    required: true
  }
}, { timestamps: true });

// Ensure one budget per category per month per user
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
