const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Deposit = require('../models/Deposit');
const Settings = require('../models/Settings');
const PromoUsage = require('../models/PromoUsage');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticate } = require('../middleware/auth');
const { sendAdminAlert } = require('../services/emailService');
const { depositStorage, deleteImage } = require('../config/cloudinary');

const ORANGE_AMOUNTS = [1, 5]; // only allowed amounts for ORANGE

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Format invalide. Accepté: JPG, JPEG, PNG'), false);
};
const upload = multer({ storage: depositStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const depositLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { message: 'Trop de demandes. Réessayez dans 15 minutes.' }
});

function generateImageHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// GET /deposits/settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    const s = await Settings.findOne({ key: 'payment' });
    res.json({
      d17Number: s?.d17Number || '',
      orangeNumber: s?.orangeNumber || '',
      promoEnabled: s?.promoEnabled ?? true,
      promoBonusOnDeposit: s?.promoBonusOnDeposit ?? 2,
      orangeAmounts: ORANGE_AMOUNTS,
    });
  } catch { res.status(500).json({ message: 'Erreur serveur' }); }
});

// POST /deposits
router.post('/', authenticate, depositLimiter,
  (req, res, next) => {
    upload.single('screenshot')(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Fichier trop grand. Max 5 MB.' });
        return res.status(400).json({ message: err.message });
      }
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "La capture d'écran est obligatoire." });

    const { amount, method, orangeCode, promoCode } = req.body;

    // Method validation
    if (!['D17', 'ORANGE'].includes(method)) {
      return res.status(400).json({ message: 'Méthode invalide. Choisissez D17 ou ORANGE' });
    }
    // Amount validation
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
    }
    // ORANGE: only predefined amounts
    if (method === 'ORANGE' && !ORANGE_AMOUNTS.includes(parsedAmount)) {
      return res.status(400).json({ message: `Pour Orange, les montants autorisés sont: ${ORANGE_AMOUNTS.join(' TND, ')} TND` });
    }
    // ORANGE: orangeCode required
    if (method === 'ORANGE' && !orangeCode?.trim()) {
      return res.status(400).json({ message: 'Le code Orange est obligatoire pour la méthode ORANGE' });
    }

    try {
      // Daily limit
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayCount = await Deposit.countDocuments({ userId: req.user._id, createdAt: { $gte: todayStart } });
      if (todayCount >= 3) {
        // Delete from Cloudinary
        if (req.file.public_id) await deleteImage(req.file.public_id);
        return res.status(429).json({ message: 'Maximum 3 dépôts par jour atteint.' });
      }

      // Generate hash from file buffer if available
      let screenshotHash = null;
      if (req.file.buffer) {
        screenshotHash = generateImageHash(req.file.buffer);
      } else {
        // Use filename as fallback
        screenshotHash = crypto.createHash('sha256').update(req.file.filename).digest('hex');
      }

      // Duplicate screenshot hash check
      if (screenshotHash && await Deposit.findOne({ screenshotHash })) {
        if (req.file.public_id) await deleteImage(req.file.public_id);
        return res.status(409).json({ message: "Cette capture d'écran a déjà été utilisée." });
      }

      // Duplicate orange code
      const cleanOrangeCode = (method === 'ORANGE' && orangeCode?.trim()) ? orangeCode.trim() : null;
      if (cleanOrangeCode && await Deposit.findOne({ orangeCode: cleanOrangeCode })) {
        if (req.file.public_id) await deleteImage(req.file.public_id);
        return res.status(409).json({ message: 'Ce code Orange a déjà été utilisé.' });
      }

      // Promo code validation
      let promoBonus = 0;
      let promoOwner = null;
      const cleanPromo = promoCode?.trim().toUpperCase();
      if (cleanPromo) {
        const settings = await Settings.findOne({ key: 'payment' });
        if (!settings?.promoEnabled) {
          if (req.file.public_id) await deleteImage(req.file.public_id);
          return res.status(400).json({ message: 'Le système de promo est désactivé.' });
        }
        promoOwner = await User.findOne({ promoCode: cleanPromo });
        if (!promoOwner) {
          if (req.file.public_id) await deleteImage(req.file.public_id);
          return res.status(400).json({ message: 'Code promo invalide.' });
        }
        if (promoOwner._id.toString() === req.user._id.toString()) {
          if (req.file.public_id) await deleteImage(req.file.public_id);
          return res.status(400).json({ message: 'Vous ne pouvez pas utiliser votre propre code promo.' });
        }
        const alreadyUsed = await PromoUsage.findOne({ userId: req.user._id, promoCode: cleanPromo });
        if (alreadyUsed) {
          if (req.file.public_id) await deleteImage(req.file.public_id);
          return res.status(409).json({ message: 'Vous avez déjà utilisé ce code promo.' });
        }
        promoBonus = settings?.promoBonusOnDeposit ?? 2;
      }

      // Get user for admin notification
      const user = await User.findById(req.user._id);

      const deposit = await Deposit.create({
        userId: req.user._id,
        amount: parsedAmount,
        method,
        screenshot: req.file.path, // Cloudinary URL
        screenshotPublicId: req.file.filename, // Cloudinary public_id
        screenshotHash,
        orangeCode: cleanOrangeCode,
        promoCode: cleanPromo || null,
        promoBonus,
      });

      // Log promo usage immediately (bonus applied on approval)
      if (promoOwner && cleanPromo) {
        await PromoUsage.create({
          userId: req.user._id,
          promoCode: cleanPromo,
          ownerId: promoOwner._id,
          bonusAmount: promoBonus,
          depositId: deposit._id,
        });
      }

      // Send admin notification
      try {
        await sendAdminAlert(
          'Nouveau Dépôt',
          `Nouveau dépôt de ${user.name} (${user.phone}): ${parsedAmount} TND via ${method}`
        );
      } catch (alertErr) {
        console.error('Admin alert error:', alertErr);
      }

      res.status(201).json({ message: 'Demande de dépôt envoyée avec succès.', deposit, promoBonus });
    } catch (err) {
      // Delete from Cloudinary on error
      if (req.file?.public_id) {
        await deleteImage(req.file.public_id);
      }
      if (err.code === 11000) return res.status(409).json({ message: "Capture d'écran ou code Orange en double." });
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

router.get('/my', authenticate, async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user._id })
      .select('-screenshotPublicId -screenshotHash')
      .sort({ createdAt: -1 });
    res.json(deposits);
  } catch { res.status(500).json({ message: 'Erreur serveur' }); }
});

module.exports = router;
