const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, deleteExpense, updateExpense, payBulkExpenses } = require('../controllers/expenseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getExpenses)
  .post(protect, admin, createExpense);

router.post('/pay-bulk', protect, admin, payBulkExpenses);

router.route('/:id')
  .put(protect, admin, updateExpense)
  .delete(protect, admin, deleteExpense);

module.exports = router;
