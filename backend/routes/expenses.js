const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

// @route   GET /api/expenses
// @desc    Get all expenses for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/expenses
// @desc    Add new expense
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;

    const newExpense = new Expense({
      user: req.user.id,
      title,
      amount,
      category,
      date: date || new Date(),
      notes
    });

    const expense = await newExpense.save();
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

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Make sure user owns expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const { title, amount, category, date, notes } = req.body;
    
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: { title, amount, category, date, notes } },
      { new: true }
    );

    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/expenses/import
// @desc    Bulk import expenses
// @access  Private
router.post('/import', auth, async (req, res) => {
  try {
    const expenses = req.body.expenses.map(exp => ({
      ...exp,
      user: req.user.id
    }));

    const inserted = await Expense.insertMany(expenses);
    res.json(inserted);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to import expenses', error: err.message });
  }
});

// @route   GET /api/expenses/total
// @desc    Get total expenses
// @access  Private
router.get('/total', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    res.json({ total });
  } catch(err) { 
    console.error(err.message);
    res.status(500).send('Server Error'); 
  }
});

// @route   POST /api/expenses/auto-sync
// @desc    Detect expense from SMS or Email and auto-add
// @access  Private
router.post('/auto-sync', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message text is required' });

    // 1. Extract Amount
    let amount = 0;
    const amountMatch = message.match(/(?:rs\.?|inr|₹|amount|paid)\s*([\d,]+\.?\d*)|([\d,]+\.?\d*)\s*(?:rs\.?|inr|₹)/i);
    if (!amountMatch) {
       return res.status(400).json({ message: 'Could not detect an amount. Please ensure the message contains the exact amount.' });
    }
    amount = parseFloat((amountMatch[1] || amountMatch[2] || '0').replace(/,/g, ''));

    // 2. Extract Merchant
    let merchant = 'Unknown Merchant';
    const lowerMessage = message.toLowerCase();
    const merchantMatch = message.match(/(?:to|at|for|from)\s+([A-Za-z0-9\s]+?)(?:\s+via|\.|\n|$)/i);
    if (merchantMatch && merchantMatch[1].length > 2) {
       merchant = merchantMatch[1].trim();
    } else {
        if (lowerMessage.includes('swiggy')) merchant = 'Swiggy';
        else if (lowerMessage.includes('zomato')) merchant = 'Zomato';
        else if (lowerMessage.includes('uber')) merchant = 'Uber';
        else if (lowerMessage.includes('amazon')) merchant = 'Amazon';
        else if (lowerMessage.includes('flipkart')) merchant = 'Flipkart';
        else if (lowerMessage.includes('netflix')) merchant = 'Netflix';
    }
    merchant = merchant.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    // 3. Extract Payment Mode
    let paymentMode = 'Other';
    if (lowerMessage.includes('upi')) paymentMode = 'UPI';
    else if (lowerMessage.includes('card') || lowerMessage.includes('debit') || lowerMessage.includes('credit')) paymentMode = 'Card';
    else if (lowerMessage.includes('netbanking')) paymentMode = 'NetBanking';

    // 4. Smart Categorization
    let category = 'Other';
    const categories = {
        'Food': ['swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonalds', 'kfc', 'dominos', 'food', 'dining'],
        'Transport': ['uber', 'ola', 'rapido', 'irctc', 'petrol', 'fuel', 'metro', 'auto', 'ride'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'reliance', 'mall', 'store', 'shop'],
        'Entertainment': ['netflix', 'prime', 'hotstar', 'spotify', 'pvr', 'movie', 'ticket', 'show'],
        'Bills': ['jio', 'airtel', 'vi', 'bescom', 'electricity', 'broadband', 'recharge', 'bill', 'water', 'gas']
    };
    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(kw => merchant.toLowerCase().includes(kw) || lowerMessage.includes(kw))) {
            category = cat;
            break;
        }
    }

    // 5. Extract Transaction ID
    let transactionId = null;
    const txnMatch = message.match(/(?:Ref|Txn|Reference|UPI\s*Ref|ID)\s*[:\-]?\s*([A-Za-z0-9]{6,})/i);
    if (txnMatch) transactionId = txnMatch[1].trim();

    // 6. Duplicate Detection
    if (transactionId) {
        const existing = await Expense.findOne({ transactionId, user: req.user.id });
        if (existing) {
             return res.status(409).json({ message: 'Duplicate Transaction ID detected', data: existing });
        }
    }
    
    // Timeframe fallback for duplicate
    const recentTime = new Date(Date.now() - 5 * 60 * 1000); // last 5 minutes
    const duplicate = await Expense.findOne({ 
        user: req.user.id, 
        amount: amount, 
        title: { $regex: new RegExp(merchant, 'i') },
        date: { $gte: recentTime }
    });
    
    if (duplicate) {
        return res.status(409).json({ message: 'Probable duplicate transaction detected within the last 5 minutes', data: duplicate });
    }

    // 7. Store automatically
    const newExpense = new Expense({
      user: req.user.id,
      title: merchant,
      amount,
      category,
      paymentMode,
      source: 'Auto-detected',
      transactionId,
      date: new Date()
    });

    const expense = await newExpense.save();
    res.json({ message: 'Transaction Auto-detected & Saved!', expense });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during auto-sync' });
  }
});

// @route   GET /api/expenses/category-analysis
// @desc    Category-wise total
// @access  Private
router.get('/category-analysis', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    const analysis = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    
    res.json(analysis);
  } catch(err) { res.status(500).send('Server Error'); }
});

// @route   GET /api/expenses/predict
// @desc    Monthly prediction
// @access  Private
router.get('/predict', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    if(expenses.length === 0) return res.json({ prediction: 0 });
    
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const dates = expenses.map(e => new Date(e.date));
    const firstDate = new Date(Math.min(...dates));
    
    let numMonths = (new Date() - firstDate) / (1000 * 60 * 60 * 24 * 30.44);
    if(numMonths < 1) numMonths = 1;
    
    // Regression baseline algorithm
    const prediction = (total / numMonths) * 1.05;
    
    res.json({ prediction });
  } catch(err) { res.status(500).send('Server Error'); }
});

module.exports = router;
