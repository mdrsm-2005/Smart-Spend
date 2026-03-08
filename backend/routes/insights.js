const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// @route   GET /api/insights
// @desc    Get AI-styled insights based on spending vs budgets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const month = req.query.month; // Expected YYYY-MM
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required (YYYY-MM)' });
    }

    // First and last day of the month
    const [yearStr, monthStr] = month.split('-');
    const startDate = new Date(yearStr, parseInt(monthStr) - 1, 1);
    const endDate = new Date(yearStr, parseInt(monthStr), 0, 23, 59, 59, 999);

    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const budgets = await Budget.find({
      user: req.user.id,
      month
    });

    const insights = [];

    // Calculate totals by category
    const categoryTotals = {};
    let totalSpent = 0;
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      totalSpent += exp.amount;
    });

    if (totalSpent === 0) {
      return res.json([{ type: 'info', text: 'No expenses recorded for this month yet. Start tracking to see insights!' }]);
    }

    // 1. Highest spending category
    let highestCat = '';
    let highestAmt = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > highestAmt) {
        highestAmt = amt;
        highestCat = cat;
      }
    }
    const percentOfTotal = Math.round((highestAmt / totalSpent) * 100);
    insights.push({ 
      type: 'warning', 
      text: `You spent ${percentOfTotal}% of your budget on ${highestCat} this month. Consider reducing this.` 
    });

    // 2. Budget vs Actual analysis
    for (const b of budgets) {
      const spent = categoryTotals[b.category] || 0;
      if (spent > b.amount) {
        const over = spent - b.amount;
        insights.push({
          type: 'danger',
          text: `You have exceeded your ${b.category} budget by $${over.toFixed(2)}.`
        });
      } else if (spent > b.amount * 0.8) {
        insights.push({
          type: 'warning',
          text: `You are nearing your ${b.category} budget limits. Only $${(b.amount - spent).toFixed(2)} remaining.`
        });
      }
    }

    // 3. Saving suggestion (simple generic rule: save 20% of income, or suggest reducing highest category by 10%)
    const potentialSavings = (highestAmt * 0.1).toFixed(2);
    insights.push({
      type: 'success',
      text: `You could save $${potentialSavings} by reducing your ${highestCat} expenses by just 10%.`
    });

    res.json(insights);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/insights/goal-insights
// @desc    Generate AI smart insights for a specific goal
// @access  Public (or Private if auth is needed, but we'll use auth)
router.post('/goal-insights', auth, async (req, res) => {
  try {
    const { goalName, targetAmount, monthlySaving, currentSpending } = req.body;

    if (!goalName || !targetAmount || !monthlySaving || !currentSpending) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1. Estimated Time Calculation
    const totalMonths = Math.ceil(targetAmount / monthlySaving);
    
    const formatTime = (totalM) => {
      const y = Math.floor(totalM / 12);
      const m = totalM % 12;
      let timeStr = '';
      if (y > 0) timeStr += `${y} year${y > 1 ? 's' : ''} `;
      if (m > 0 || (y === 0 && m === 0)) timeStr += `${m} month${m !== 1 ? 's' : ''}`;
      return timeStr.trim();
    };

    const estimatedTimeStr = formatTime(totalMonths);

    // 2. Extra Savings Tips
    const savingsTips = [
      "Cancel unused subscriptions or auto-renewals.",
      "Switch to generic brands for everyday groceries.",
      "Cook meals at home instead of dining out.",
      "Use the 30-day rule: wait 30 days before making large impulse purchases.",
      "Take advantage of cashback and reward points."
    ];
    // Select a random tip
    const randomTip = savingsTips[Math.floor(Math.random() * savingsTips.length)];

    // 3. Smart Spending Reduction Suggestion
    let highestCat = '';
    let highestAmt = 0;

    for (const [cat, amt] of Object.entries(currentSpending)) {
      if (amt > highestAmt) {
        highestAmt = amt;
        highestCat = cat;
      }
    }

    let smartTip = '';
    if (highestAmt > 0) {
      // Suggest 20% reduction
      const reduction = highestAmt * 0.2;
      const newMonthlySaving = monthlySaving + reduction;
      const newTotalMonths = Math.ceil(targetAmount / newMonthlySaving);
      const monthsSaved = totalMonths - newTotalMonths;
      
      const savedTimeStr = formatTime(monthsSaved);
      smartTip = `Reduce ${highestCat} by ₹${reduction}/month to reach your goal ${savedTimeStr} earlier.`;
    } else {
       smartTip = `Reduce your overall expenses by 20% to reach your goal faster.`;
    }

    // 4. Investment Tip
    const sipAmount = Math.ceil(monthlySaving * 0.5);

    // Construct Text Output
    const insightCard = `Insight Example

📊 Goal: ${goalName}
🎯 Target: ₹${targetAmount}
💰 Monthly Saving: ₹${monthlySaving}

⏳ Estimated Time: ${estimatedTimeStr}

💡 Smart Spending Reduction
${smartTip}

✂️ Quick Expense Tip
${randomTip}

📈 Investment Tip
Start a ₹${sipAmount} SIP to accelerate goal completion.`;

    res.json({
      goalName,
      targetAmount,
      monthlySaving,
      estimatedTimeStr,
      smartTip,
      randomTip,
      sipAmount,
      insightText: insightCard
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
