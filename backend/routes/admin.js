const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const PromoUsage = require('../models/PromoUsage');
const Settings = require('../models/Settings');
const { authenticate, adminOnly } = require('../middleware/auth');


const express = require('express');
const router = express.Router();
const User = require('../models/User');

// BAN USER + DEVICE
router.put('/ban/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 🔥 ban
    user.isBanned = true;
    await user.save();

    res.json({ msg: "User banned successfully 🔒" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;





router.use(authenticate, adminOnly);

// ── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [users, deposits, tickets, pendingDeposits, promoUsages] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Deposit.countDocuments(),
      Ticket.countDocuments({ isActive: true }),
      Deposit.countDocuments({ status: 'pending' }),
      PromoUsage.countDocuments(),
    ]);
    res.json({ users, deposits, tickets, pendingDeposits, promoUsages });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: user.toSafeObject() });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PATCH /admin/users/balance — manual balance adjustment
router.patch('/users/balance', [
  body('userId').notEmpty(),
  body('amount').isFloat({ min: 0.001 }),
  body('action').isIn(['add', 'remove']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const { userId, amount, action } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const delta = parseFloat(amount);
    const balanceBefore = user.balance;
    if (action === 'remove') {
      if (user.balance < delta) return res.status(400).json({ message: `Solde insuffisant: ${user.balance.toFixed(3)} TND` });
      user.balance = parseFloat((user.balance - delta).toFixed(3));
    } else {
      user.balance = parseFloat((user.balance + delta).toFixed(3));
    }
    await user.save();
    await Transaction.create({
      userId: user._id, type: action === 'add' ? 'deposit' : 'purchase',
      amount: action === 'add' ? delta : -delta,
      balanceBefore, balanceAfter: user.balance,
      description: `Ajustement manuel admin (${action === 'add' ? '+' : '-'}${delta} TND)`,
    });
    res.json({ message: 'Solde mis à jour', newBalance: user.balance, user: user.toSafeObject() });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── DEPOSITS ─────────────────────────────────────────────────────────────────
router.get('/deposits', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const deposits = await Deposit.find(filter)
      .populate('userId', 'name phone email balance')
      .sort({ createdAt: -1 });
    res.json(deposits);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/deposits/:id/approve', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ message: 'Already processed' });
    const user = await User.findById(deposit.userId);
    const balanceBefore = user.balance;
    const totalCredit = deposit.amount + (deposit.promoBonus || 0);
    user.balance = parseFloat((user.balance + totalCredit).toFixed(3));
    await user.save();
    deposit.status = 'approved'; deposit.processedAt = new Date(); deposit.processedBy = req.user._id;
    await deposit.save();
    await Transaction.create({
      userId: user._id, type: 'deposit', amount: totalCredit,
      balanceBefore, balanceAfter: user.balance,
      description: `Dépôt approuvé - ${deposit.method}${deposit.promoBonus ? ` (+${deposit.promoBonus} TND bonus promo)` : ''}`,
      reference: deposit._id, referenceModel: 'Deposit',
    });
    res.json({ message: 'Dépôt approuvé', newBalance: user.balance });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/deposits/:id/reject', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ message: 'Already processed' });
    deposit.status = 'rejected'; deposit.processedAt = new Date();
    deposit.processedBy = req.user._id; deposit.adminNote = req.body.note || null;
    await deposit.save();
    res.json({ message: 'Dépôt rejeté' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── TICKETS ──────────────────────────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try { res.json(await Ticket.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/tickets', [
  body('title').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('globalOdds').isFloat({ min: 1 }),
  body('matches').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    for (const m of req.body.matches) {
      if (!m.team1?.trim() || !m.team2?.trim() || !m.betType?.trim() || !m.odds)
        return res.status(400).json({ message: 'Tous les champs de match sont obligatoires' });
    }
    res.status(201).json(await Ticket.create(req.body));
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/tickets/:id', async (req, res) => {
  try {
    if (req.body.matches) {
      for (const m of req.body.matches) {
        if (!m.team1?.trim() || !m.team2?.trim() || !m.betType?.trim() || !m.odds)
          return res.status(400).json({ message: 'Tous les champs de match sont obligatoires' });
      }
    }
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/tickets/:id', async (req, res) => {
  try { await Ticket.findByIdAndDelete(req.params.id); res.json({ message: 'Ticket deleted' }); }
  catch { res.status(500).json({ message: 'Server error' }); }
});

// ── SETTINGS ─────────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const s = await Settings.findOne({ key: 'payment' });
    res.json({
      d17Number: s?.d17Number || '',
      orangeNumber: s?.orangeNumber || '',
      promoEnabled: s?.promoEnabled ?? true,
      promoBonusOnDeposit: s?.promoBonusOnDeposit ?? 2,
      referralBonus: s?.referralBonus ?? 2,
    });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.put('/settings', async (req, res) => {
  try {
    const { d17Number, orangeNumber, promoEnabled, promoBonusOnDeposit, referralBonus } = req.body;
    const s = await Settings.findOneAndUpdate(
      { key: 'payment' },
      { d17Number, orangeNumber, promoEnabled, promoBonusOnDeposit, referralBonus },
      { upsert: true, new: true }
    );
    res.json({ message: 'Paramètres mis à jour', settings: s });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── PROMO STATS ───────────────────────────────────────────────────────────────
router.get('/promo-stats', async (req, res) => {
  try {
    const usages = await PromoUsage.find()
      .populate('userId', 'name phone')
      .populate('ownerId', 'name phone promoCode')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(usages);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
