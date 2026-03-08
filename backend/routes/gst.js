const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GSTExpense = require('../models/GSTExpense');

// @route   GET /api/gst
// @desc    Get all GST expenses for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const gstExpenses = await GSTExpense.find({ user: req.user.id }).sort({ date: -1 });
    res.json(gstExpenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/gst
// @desc    Add new GST expense
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { vendorName, purchaseAmount, gstAmount, totalAmount, date } = req.body;

    const newGSTExpense = new GSTExpense({
      user: req.user.id,
      vendorName,
      purchaseAmount,
      gstAmount,
      totalAmount,
      date: date || new Date()
    });

    const expense = await newGSTExpense.save();
    res.json(expense);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/gst/:id
// @desc    Delete a GST expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await GSTExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'GST Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await expense.deleteOne();
    res.json({ message: 'GST Expense removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'GST Expense not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
