const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { authenticate, adminOnly } = require('../middleware/auth');
const { sendPurchaseConfirmationEmail } = require('../services/emailService');

// Get all active tickets (with purchase protection)
router.get('/', authenticate, async (req, res) => {
  try {
    const now = new Date();

    // Get active, non-expired, non-archived tickets
    const tickets = await Ticket.find({
      isActive: true,
      isExpired: false,
      isArchived: false,
      expirationDate: { $gt: now }
    }).sort({ createdAt: -1 });

    // Get user's purchases
    const purchases = await Purchase.find({ userId: req.user._id });
    const purchasedMap = new Map(purchases.map(p => [p.ticketId.toString(), p]));

    const result = tickets.map(ticket => {
      const t = ticket.toObject();
      const purchase = purchasedMap.get(t._id.toString());
      const isPurchased = !!purchase;

      if (!isPurchased) {
        // FULL PROTECTION: Hide all match details for non-purchased users
        t.matches = [];
        t.globalOdds = t.showOdds ? t.globalOdds : null;
        t.isLocked = true;
      } else {
        // Add watermark data to purchased ticket
        t.isLocked = false;
        t.watermark = {
          userName: purchase.watermarkData?.userName || req.user.name,
          userPhone: purchase.watermarkData?.userPhone || req.user.phone,
          purchaseId: purchase.watermarkData?.purchaseId || purchase._id.toString().slice(-8).toUpperCase(),
          purchasedAt: purchase.watermarkData?.purchasedAt || purchase.createdAt
        };
      }

      t.isPurchased = isPurchased;
      t.timeRemaining = Math.max(0, new Date(t.expirationDate) - now);
      return t;
    });

    res.json(result);
  } catch (err) {
    console.error('Tickets fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ticket details (with full protection)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if ticket is expired or archived
    if (ticket.isExpired || ticket.isArchived) {
      return res.status(410).json({ message: 'Ticket is no longer available' });
    }

    // Check if user has purchased this ticket
    const purchase = await Purchase.findOne({
      userId: req.user._id,
      ticketId: ticket._id
    });

    const isPurchased = !!purchase;
    const t = ticket.toObject();

    if (!isPurchased) {
      // LOCKED: Return minimal info only
      return res.json({
        _id: t._id,
        title: t.title,
        price: t.price,
        category: t.category,
        description: t.description,
        successProbability: t.successProbability,
        globalOdds: t.showOdds ? t.globalOdds : null,
        firstMatchDate: t.firstMatchDate,
        expirationDate: t.expirationDate,
        matchCount: t.matches?.length || 0,
        isPurchased: false,
        isLocked: true,
        timeRemaining: Math.max(0, new Date(t.expirationDate) - new Date())
      });
    }

    // PURCHASED: Update view count and return full details with watermark
    purchase.viewCount += 1;
    purchase.lastViewedAt = new Date();
    await purchase.save();

    t.isPurchased = true;
    t.isLocked = false;
    t.watermark = {
      userName: purchase.watermarkData?.userName || req.user.name,
      userPhone: purchase.watermarkData?.userPhone || req.user.phone,
      purchaseId: purchase.watermarkData?.purchaseId || purchase._id.toString().slice(-8).toUpperCase(),
      purchasedAt: purchase.watermarkData?.purchasedAt || purchase.createdAt,
      viewCount: purchase.viewCount
    };
    t.timeRemaining = Math.max(0, new Date(t.expirationDate) - new Date());

    res.json(t);
  } catch (err) {
    console.error('Ticket detail error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase a ticket
router.post('/:id/purchase', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket || !ticket.isActive) return res.status(404).json({ message: 'Ticket not found' });

    // Check if ticket is expired
    if (ticket.isExpired || ticket.isArchived || new Date(ticket.expirationDate) <= new Date()) {
      return res.status(410).json({ message: 'Ticket is no longer available for purchase' });
    }

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

    // Create purchase with watermark data
    const purchase = await Purchase.create({
      userId: user._id,
      ticketId: ticket._id,
      pricePaid: ticket.price,
      watermarkData: {
        userName: user.name,
        userPhone: user.phone,
        purchasedAt: new Date(),
        purchaseId: uuidv4().slice(0, 8).toUpperCase()
      }
    });

    await Transaction.create({
      userId: user._id, type: 'purchase', amount: -ticket.price,
      balanceBefore, balanceAfter: user.balance,
      description: `Purchased ticket: ${ticket.title}`,
      reference: ticket._id, referenceModel: 'Ticket'
    });

    ticket.purchaseCount += 1;
    await ticket.save();

    // Send email confirmation if user has verified email
    if (user.email && user.emailVerified) {
      try {
        await sendPurchaseConfirmationEmail(user, ticket);
      } catch (emailErr) {
        console.error('Purchase confirmation email failed:', emailErr);
      }
    }

    res.json({
      message: 'Ticket purchased successfully',
      newBalance: user.balance,
      ticket,
      watermark: purchase.watermarkData
    });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
