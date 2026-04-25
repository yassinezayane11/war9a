const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/purchases', authenticate, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id })
      .populate('ticketId')
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
