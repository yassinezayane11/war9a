const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');
const PromoUsage = require('../models/PromoUsage');
const Settings = require('../models/Settings');
const BannedDevice = require('../models/BannedDevice');
const MarketingImage = require('../models/MarketingImage');
const Testimonial = require('../models/Testimonial');
const EmailLog = require('../models/EmailLog');
const { authenticate, adminOnly } = require('../middleware/auth');
const { sendDepositStatusEmail, sendBroadcastEmail, sendAdminAlert } = require('../services/emailService');
const { marketingStorage, deleteImage } = require('../config/cloudinary');

const upload = multer({ storage: marketingStorage });

// BAN USER + DEVICE (Public endpoint before auth middleware)
router.put('/ban/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Ban user
    user.isBanned = true;
    user.bannedAt = new Date();
    user.banReason = req.body.reason || 'Violation des conditions d\'utilisation';
    await user.save();

    // Also ban device if fingerprint exists
    if (user.fingerprint) {
      await BannedDevice.findOneAndUpdate(
        { fingerprint: user.fingerprint },
        {
          fingerprint: user.fingerprint,
          userId: user._id,
          userName: user.name,
          userPhone: user.phone,
          userAgent: user.userAgent,
          ip: user.lastIP,
          reason: user.banReason,
          bannedBy: req.user._id,
          isActive: true
        },
        { upsert: true, new: true }
      );
    }

    res.json({ msg: "User and device banned successfully 🔒" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UNBAN USER
router.put('/unban/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    await user.save();

    // Unban device
    if (user.fingerprint) {
      await BannedDevice.findOneAndUpdate(
        { fingerprint: user.fingerprint },
        { isActive: false },
        { new: true }
      );
    }

    res.json({ msg: "User unbanned successfully ✓" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});





router.use(authenticate, adminOnly);

// ── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      newUsersToday,
      totalDeposits,
      pendingDeposits,
      approvedDepositsToday,
      totalDepositsAmount,
      activeTickets,
      expiredTickets,
      winningTickets,
      totalPurchases,
      todayPurchases,
      promoUsages,
      totalRevenue,
      usersWithEmail,
      verifiedEmails
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true, isBanned: false }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ role: 'user', createdAt: { $gte: todayStart } }),
      Deposit.countDocuments(),
      Deposit.countDocuments({ status: 'pending' }),
      Deposit.countDocuments({ status: 'approved', processedAt: { $gte: todayStart } }),
      Deposit.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Ticket.countDocuments({ isActive: true, isExpired: false }),
      Ticket.countDocuments({ isExpired: true }),
      Ticket.countDocuments({ isWinning: true }),
      Purchase.countDocuments(),
      Purchase.countDocuments({ createdAt: { $gte: todayStart } }),
      PromoUsage.countDocuments(),
      Purchase.aggregate([{ $group: { _id: null, total: { $sum: '$pricePaid' } } }]),
      User.countDocuments({ email: { $ne: null } }),
      User.countDocuments({ emailVerified: true })
    ]);

    // Weekly revenue data
    const weeklyRevenue = await Purchase.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$pricePaid' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        newToday: newUsersToday,
        withEmail: usersWithEmail,
        verifiedEmails
      },
      deposits: {
        total: totalDeposits,
        pending: pendingDeposits,
        approvedToday: approvedDepositsToday,
        totalAmount: totalDepositsAmount[0]?.total || 0
      },
      tickets: {
        active: activeTickets,
        expired: expiredTickets,
        winning: winningTickets
      },
      purchases: {
        total: totalPurchases,
        today: todayPurchases,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      promoUsages,
      weeklyRevenue
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'deposits',
          let: { uid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$uid'] },
                    { $eq: ['$status', 'approved'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          as: 'depositStats'
        }
      },
      {
        $lookup: {
          from: 'purchases',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: '$pricePaid' },
                count: { $sum: 1 },
                winningCount: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
              }
            }
          ],
          as: 'purchaseStats'
        }
      },
      {
        $lookup: {
          from: 'purchases',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { ticketId: 1, createdAt: 1, status: 1, pricePaid: 1 } }
          ],
          as: 'lastPurchase'
        }
      },
      {
        $lookup: {
          from: 'tickets',
          localField: 'lastPurchase.ticketId',
          foreignField: '_id',
          as: 'lastTicket'
        }
      },
      {
        $lookup: {
          from: 'promousages',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$ownerId', '$$uid'] } } },
            { $group: { _id: null, totalEarnings: { $sum: '$bonusAmount' }, count: { $sum: 1 } } }
          ],
          as: 'referralStats'
        }
      },
      {
        $addFields: {
          deposits: {
            totalAmount: { $ifNull: [{ $arrayElemAt: ['$depositStats.totalAmount', 0] }, 0] },
            count: { $ifNull: [{ $arrayElemAt: ['$depositStats.count', 0] }, 0] }
          },
          purchases: {
            totalSpent: { $ifNull: [{ $arrayElemAt: ['$purchaseStats.totalSpent', 0] }, 0] },
            count: { $ifNull: [{ $arrayElemAt: ['$purchaseStats.count', 0] }, 0] },
            winningCount: { $ifNull: [{ $arrayElemAt: ['$purchaseStats.winningCount', 0] }, 0] }
          },
          lastPurchaseInfo: {
            createdAt: { $arrayElemAt: ['$lastPurchase.createdAt', 0] },
            status: { $arrayElemAt: ['$lastPurchase.status', 0] },
            pricePaid: { $arrayElemAt: ['$lastPurchase.pricePaid', 0] },
            ticketTitle: { $arrayElemAt: ['$lastTicket.title', 0] }
          },
          referral: {
            earnings: { $ifNull: [{ $arrayElemAt: ['$referralStats.totalEarnings', 0] }, 0] },
            usages: { $ifNull: [{ $arrayElemAt: ['$referralStats.count', 0] }, 0] }
          }
        }
      },
      {
        $project: {
          password: 0,
          depositStats: 0,
          purchaseStats: 0,
          lastPurchase: 0,
          lastTicket: 0,
          referralStats: 0
        }
      }
    ]);

    const fingerprintMap = new Map();
    for (const u of users) {
      const fp = u.fingerprint || null;
      if (!fp) continue;
      fingerprintMap.set(fp, (fingerprintMap.get(fp) || 0) + 1);
    }

    const enriched = users.map(u => {
      const depositTotal = u.deposits?.totalAmount || 0;
      const purchaseTotal = u.purchases?.totalSpent || 0;
      const vipLevel = depositTotal >= 500 || purchaseTotal >= 500 ? 'VIP'
        : depositTotal >= 200 || purchaseTotal >= 200 ? 'Gold'
        : depositTotal >= 100 || purchaseTotal >= 100 ? 'Silver'
        : 'Bronze';

      const purchaseCount = u.purchases?.count || 0;
      const winningCount = u.purchases?.winningCount || 0;
      const successRate = purchaseCount > 0 ? Math.round((winningCount / purchaseCount) * 100) : 0;
      const fpDupCount = u.fingerprint ? (fingerprintMap.get(u.fingerprint) || 1) : 0;

      return {
        ...u,
        vipLevel,
        risk: {
          duplicateFingerprintCount: fpDupCount,
          hasDuplicateFingerprint: fpDupCount > 1
        },
        ticketStats: {
          purchasedCount: purchaseCount,
          winningCount,
          successRate,
          lastPurchasedAt: u.lastPurchaseInfo?.createdAt || null,
          lastPurchasedTicketTitle: u.lastPurchaseInfo?.ticketTitle || null
        },
        financial: {
          currentBalance: u.balance || 0,
          totalDeposits: depositTotal,
          totalDepositsCount: u.deposits?.count || 0,
          totalWithdrawals: 0,
          totalPurchases: purchaseTotal,
          totalPurchasesCount: purchaseCount,
          profitLoss: depositTotal - purchaseTotal
        },
        referral: {
          ...u.referral,
          count: u.referralCount || 0
        }
      };
    });

    res.json(enriched);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /admin/users/:id/details — detailed user profile for modal
router.get('/users/:id/details', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [deposits, purchases, transactions, promoUsages] = await Promise.all([
      Deposit.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
      Purchase.find({ userId: user._id }).populate('ticketId', 'title price category isWinning').sort({ createdAt: -1 }).limit(50),
      Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
      PromoUsage.find({ $or: [{ userId: user._id }, { ownerId: user._id }] }).sort({ createdAt: -1 }).limit(50),
    ]);

    res.json({
      user,
      deposits,
      purchases,
      transactions,
      promoUsages
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /admin/users/:id/note — update admin note
router.patch('/users/:id/note', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.adminNote = typeof req.body.note === 'string' ? req.body.note : '';
    await user.save();
    res.json({ message: 'Note mise à jour', user: user.toSafeObject() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /admin/users/:id — delete account
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin account' });
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Compte supprimé' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
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

    deposit.status = 'approved';
    deposit.processedAt = new Date();
    deposit.processedBy = req.user._id;
    await deposit.save();

    await Transaction.create({
      userId: user._id, type: 'deposit', amount: totalCredit,
      balanceBefore, balanceAfter: user.balance,
      description: `Dépôt approuvé - ${deposit.method}${deposit.promoBonus ? ` (+${deposit.promoBonus} TND bonus promo)` : ''}`,
      reference: deposit._id, referenceModel: 'Deposit',
    });

    // Send email notification
    if (user.email && user.emailVerified && user.emailNotifications?.depositUpdates) {
      try {
        await sendDepositStatusEmail(user, deposit, 'approved');
      } catch (emailErr) {
        console.error('Deposit approval email error:', emailErr);
      }
    }

    res.json({ message: 'Dépôt approuvé', newBalance: user.balance });
  } catch (err) {
    console.error('Deposit approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/deposits/:id/reject', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

    deposit.status = 'rejected';
    deposit.processedAt = new Date();
    deposit.processedBy = req.user._id;
    deposit.adminNote = req.body.note || null;
    await deposit.save();

    // Send email notification
    const user = await User.findById(deposit.userId);
    if (user?.email && user.emailVerified && user.emailNotifications?.depositUpdates) {
      try {
        await sendDepositStatusEmail(user, deposit, 'rejected');
      } catch (emailErr) {
        console.error('Deposit rejection email error:', emailErr);
      }
    }

    res.json({ message: 'Dépôt rejeté' });
  } catch (err) {
    console.error('Deposit reject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── TICKETS ──────────────────────────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status === 'active') {
      filter = { isActive: true, isArchived: false, isExpired: false };
    } else if (status === 'expired') {
      filter = { isExpired: true };
    } else if (status === 'archived') {
      filter = { isArchived: true };
    } else if (status === 'winning') {
      filter = { isWinning: true };
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('Tickets fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive ticket
router.patch('/tickets/:id/archive', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, archivedAt: new Date() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket archived', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore archived ticket
router.patch('/tickets/:id/restore', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { isArchived: false, isExpired: false, archivedAt: null },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket restored', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark ticket as winning
router.patch('/tickets/:id/mark-winning', async (req, res) => {
  try {
    const { winningAmount } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        isWinning: true,
        winningAmount: winningAmount || 0,
        wonAt: new Date()
      },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket marked as winning', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
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

// ── BANNED DEVICES ───────────────────────────────────────────────────────────
router.get('/banned-devices', async (req, res) => {
  try {
    const devices = await BannedDevice.find()
      .populate('bannedBy', 'name')
      .populate('userId', 'name phone')
      .sort({ bannedAt: -1 });
    res.json(devices);
  } catch (err) {
    console.error('Banned devices error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add device to ban list manually
router.post('/banned-devices', [
  body('fingerprint').notEmpty(),
  body('reason').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { fingerprint, reason, userAgent, ip } = req.body;

    const device = await BannedDevice.create({
      fingerprint,
      reason: reason || 'Manual ban by admin',
      userAgent,
      ip,
      bannedBy: req.user._id
    });

    res.status(201).json({ message: 'Device banned', device });
  } catch (err) {
    console.error('Ban device error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unban device
router.patch('/banned-devices/:id/unban', async (req, res) => {
  try {
    const device = await BannedDevice.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device unbanned', device });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── EMAIL BROADCAST ──────────────────────────────────────────────────────────
router.post('/broadcast', [
  body('subject').trim().notEmpty(),
  body('htmlContent').trim().notEmpty(),
  body('target').isIn(['all', 'verified', 'selected'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { subject, htmlContent, target, userIds } = req.body;

    // Generate campaign ID
    const campaignId = crypto.randomBytes(16).toString('hex');

    let users = [];
    if (target === 'all') {
      // All users with any valid email (verified or not)
      users = await User.find({
        email: { $exists: true, $ne: null, $ne: '' }
      });
      console.log(`[Broadcast] Target 'all': found ${users.length} users with emails`);
    } else if (target === 'verified') {
      // Only users with verified emails
      users = await User.find({
        email: { $exists: true, $ne: null, $ne: '' },
        emailVerified: true
      });
      console.log(`[Broadcast] Target 'verified': found ${users.length} users with verified emails`);
    } else if (target === 'selected' && userIds?.length > 0) {
      // Selected users with verified emails only
      users = await User.find({
        _id: { $in: userIds },
        email: { $exists: true, $ne: null, $ne: '' }
      });
      console.log(`[Broadcast] Target 'selected': found ${users.length} valid users from ${userIds.length} selected`);
    }

    // Send broadcast emails
    const results = await sendBroadcastEmail({
      users,
      subject,
      htmlContent,
      campaignId
    });

    // Send admin confirmation
    await sendAdminAlert('Broadcast Sent', `Email broadcast "${subject}" sent to ${results.length} users.`);

    res.json({
      message: `Broadcast sent to ${results.filter(r => r.success).length} users`,
      campaignId,
      results
    });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get email logs
router.get('/email-logs', async (req, res) => {
  try {
    const { campaignId, userId, status } = req.query;
    let filter = {};
    if (campaignId) filter.campaignId = campaignId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const logs = await EmailLog.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── MARKETING IMAGES ─────────────────────────────────────────────────────────
router.get('/marketing-images', async (req, res) => {
  try {
    const images = await MarketingImage.find()
      .populate('uploadedBy', 'name')
      .sort({ order: 1, createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/marketing-images', upload.single('image'), [
  body('title').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const { title, description, link, order, duration } = req.body;

    const image = await MarketingImage.create({
      title,
      description,
      imageUrl: req.file.path,
      publicId: req.file.filename,
      link: link || null,
      order: parseInt(order) || 0,
      duration: parseInt(duration) || 5,
      uploadedBy: req.user._id
    });

    res.status(201).json({ message: 'Marketing image uploaded', image });
  } catch (err) {
    console.error('Marketing image upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/marketing-images/:id', async (req, res) => {
  try {
    const { title, description, link, isActive, order, duration } = req.body;
    const image = await MarketingImage.findByIdAndUpdate(
      req.params.id,
      { title, description, link, isActive, order, duration },
      { new: true }
    );
    if (!image) return res.status(404).json({ message: 'Image not found' });
    res.json({ message: 'Image updated', image });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/marketing-images/:id', async (req, res) => {
  try {
    const image = await MarketingImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    // Delete from Cloudinary
    if (image.publicId) {
      await deleteImage(image.publicId);
    }

    await image.deleteOne();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Delete marketing image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── TESTIMONIALS ─────────────────────────────────────────────────────────────
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .populate('userId', 'name phone')
      .populate('addedBy', 'name')
      .sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/testimonials', [
  body('name').trim().notEmpty(),
  body('text').trim().notEmpty(),
  body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, text, rating, winningAmount, isVerified, order } = req.body;

    const testimonial = await Testimonial.create({
      name,
      text,
      rating: parseInt(rating) || 5,
      winningAmount: parseFloat(winningAmount) || 0,
      isVerified: isVerified || false,
      order: parseInt(order) || 0,
      addedBy: req.user._id
    });

    res.status(201).json({ message: 'Testimonial added', testimonial });
  } catch (err) {
    console.error('Testimonial create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/testimonials/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json({ message: 'Testimonial updated', testimonial });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
