const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// @route   GET /api/goals
// @desc    Get all goals for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ date: -1 });
    res.json(goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/goals
// @desc    Add new goal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, targetAmount, monthlySavingCapacity } = req.body;

    const newGoal = new Goal({
      user: req.user.id,
      name,
      targetAmount,
      monthlySavingCapacity
    });

    const goal = await newGoal.save();
    res.json(goal);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await goal.deleteOne();
    res.json({ message: 'Goal removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
