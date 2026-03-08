const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Goal Name is required'],
    trim: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target Amount is required'],
    min: [1, 'Target Amount must be positive']
  },
  monthlySavingCapacity: {
    type: Number,
    required: [true, 'Monthly Saving Capacity is required'],
    min: [1, 'Capacity must be positive']
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
