const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticate, adminOnly } = require('../middleware/auth');

// Get all active tickets (public info)
router.get('/', authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({ isActive: true }).sort({ createdAt: -1 });
    // Get user's purchases
    const purchases = await Purchase.find({ userId: req.user._id }).select('ticketId');
    const purchasedIds = new Set(purchases.map(p => p.ticketId.toString()));

    const result = tickets.map(ticket => {
      const t = ticket.toObject();
      const isPurchased = purchasedIds.has(t._id.toString());
      if (!isPurchased) {
        // Hide full match details before purchase
        t.matches = t.matches.map(m => ({
          team1: m.team1, team2: m.team2,
          betType: m.betType,
          odds: t.showOdds ? m.odds : null
        }));
        t.globalOdds = t.showOdds ? t.globalOdds : null;
      }
      t.isPurchased = isPurchased;
      return t;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase a ticket
router.post('/:id/purchase', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket || !ticket.isActive) return res.status(404).json({ message: 'Ticket not found' });

    // Check if already purchased
    const existing = await Purchase.findOne({ userId: req.user._id, ticketId: ticket._id });
    if (existing) return res.status(409).json({ message: 'Already purchased this ticket' });

    const user = await User.findById(req.user._id);
    if (user.balance < ticket.price) {
      return res.status(402).json({ message: `Insufficient balance. Need ${ticket.price} TND, have ${user.balance} TND` });
    }

    const balanceBefore = user.balance;
    user.balance -= ticket.price;
    await user.save();

    await Purchase.create({ userId: user._id, ticketId: ticket._id, pricePaid: ticket.price });
    await Transaction.create({
      userId: user._id, type: 'purchase', amount: -ticket.price,
      balanceBefore, balanceAfter: user.balance,
      description: `Purchased ticket: ${ticket.title}`,
      reference: ticket._id, referenceModel: 'Ticket'
    });

    ticket.purchaseCount += 1;
    await ticket.save();

    res.json({ message: 'Ticket purchased successfully', newBalance: user.balance, ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
