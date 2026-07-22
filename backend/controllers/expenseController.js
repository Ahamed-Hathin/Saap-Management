const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Admin
exports.getExpenses = async (req, res) => {
  try {
    const filter = req.query.name ? { name: req.query.name } : {};
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching expenses', error: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Admin
exports.createExpense = async (req, res) => {
  try {
    const { name, description, amount, balancePayments } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ message: 'Please provide name and amount' });
    }

    const expense = new Expense({
      name,
      description,
      amount,
      balancePayments: balancePayments || [],
    });

    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating expense', error: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Admin
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting expense', error: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Admin
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (req.body.name) expense.name = req.body.name;
    if (req.body.description) expense.description = req.body.description;
    if (req.body.amount) expense.amount = req.body.amount;
    if (req.body.balancePayments) expense.balancePayments = req.body.balancePayments;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating expense', error: error.message });
  }
};

// @desc    Pay bulk amount for expenses with specific name
// @route   POST /api/expenses/pay-bulk
// @access  Admin
exports.payBulkExpenses = async (req, res) => {
  try {
    const { name, amount, method } = req.body;
    if (!name || !amount || !method) {
      return res.status(400).json({ message: 'Please provide name, amount, and method' });
    }

    let remainingAmount = Number(amount);
    if (remainingAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Find all expenses for this name, oldest first
    const expenses = await Expense.find({ name }).sort({ date: 1 });

    const updatedExpenses = [];

    for (let expense of expenses) {
      if (remainingAmount <= 0) break;

      let totalPaid = 0;
      if (expense.balancePayments && Array.isArray(expense.balancePayments)) {
        totalPaid = expense.balancePayments.reduce((sum, payment) => sum + payment.amount, 0);
      }

      const pendingAmount = expense.amount - totalPaid;

      if (pendingAmount > 0) {
        const paymentAmount = Math.min(pendingAmount, remainingAmount);
        
        if (!expense.balancePayments) {
          expense.balancePayments = [];
        }
        
        expense.balancePayments.push({
          amount: paymentAmount,
          method: method,
          date: new Date()
        });
        
        remainingAmount -= paymentAmount;
        await expense.save();
        updatedExpenses.push(expense);
      }
    }

    res.json({ message: 'Bulk payment applied successfully', updatedExpenses, remainingAmount });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing bulk payment', error: error.message });
  }
};
