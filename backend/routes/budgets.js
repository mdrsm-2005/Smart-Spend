const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Optional query parameter ?month=YYYY-MM
    const query = { user: req.user.id };
    if (req.query.month) query.month = req.query.month;

    const budgets = await Budget.find(query);
    res.json(budgets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/budgets
// @desc    Add or update a budget
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, month } = req.body;
    
    // Find if budget exists for this month and category
    let budget = await Budget.findOne({ user: req.user.id, category, month });

    if (budget) {
      // Update
      budget.amount = amount;
      await budget.save();
    } else {
      // Create
      budget = new Budget({
        user: req.user.id,
        category,
        amount,
        month
      });
      await budget.save();
    }

    res.json(budget);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    if (budget.user.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
    
    await budget.deleteOne();
    res.json({ message: 'Budget removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
