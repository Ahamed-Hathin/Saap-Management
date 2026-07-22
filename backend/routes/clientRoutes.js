const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  searchClients,
  updateClient,
  deleteClient,
  getClientOrders,
  payAllClientOrders
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

router.route('/search').get(protect, searchClients);
router.route('/').post(protect, createClient).get(protect, getClients);
router.route('/:id/orders').get(protect, getClientOrders);
router.route('/:id/pay-all').post(protect, payAllClientOrders);
router.route('/:id').put(protect, updateClient).delete(protect, deleteClient);

module.exports = router;
