const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Admin
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
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
    const { name, description, amount } = req.body;

    if (!name || !description || !amount) {
      return res.status(400).json({ message: 'Please provide name, description, and amount' });
    }

    const expense = new Expense({
      name,
      description,
      amount,
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
