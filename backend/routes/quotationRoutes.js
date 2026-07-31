const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, quotationController.getQuotations);
router.post('/', protect, quotationController.createQuotation);
router.put('/:id', protect, quotationController.updateQuotation);
router.delete('/:id', protect, quotationController.deleteQuotation);

module.exports = router;
