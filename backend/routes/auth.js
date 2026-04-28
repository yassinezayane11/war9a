const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');
const { generateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 10,
message: 'Too many auth attempts'
});

// ── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', authLimiter, [
body('phone').matches(/^\d{8}$/).withMessage('Le numéro doit avoir exactement 8 chiffres'),
body('name').trim().notEmpty().isLength({ min: 2 }),
body('password').isLength({ min: 6 }),
body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
], async (req, res) => {

const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

try {
const { phone, name, password, email, referralCode, fingerprint } = req.body;


// ❌ منع register device banned
const banned = await User.findOne({ fingerprint, isBanned: true });
if (banned) {
  return res.status(403).json({ message: "Appareil bloqué ❌" });
}

// check phone/email
if (await User.findOne({ phone })) {
  return res.status(409).json({ message: 'Ce numéro est déjà enregistré' });
}
if (email && await User.findOne({ email })) {
  return res.status(409).json({ message: 'Cet email est déjà utilisé' });
}

// referral
let referrer = null;
let referralBonus = 0;

if (referralCode) {
  const settings = await Settings.findOne({ key: 'payment' });

  if (settings?.promoEnabled) {
    referrer = await User.findOne({ promoCode: referralCode.trim().toUpperCase() });
    if (!referrer) {
      return res.status(400).json({ message: 'Code invalide' });
    }
    referralBonus = settings?.referralBonus ?? 2;
  }
}

// create user 🔥 (with fingerprint)
const user = await User.create({
  phone,
  name,
  password,
  email: email || null,
  fingerprint, // 🔥 هنا
  referredBy: referrer?._id || null,
  balance: referralBonus,
});

if (referrer && referralBonus > 0) {
  await Transaction.create({
    userId: user._id,
    type: 'deposit',
    amount: referralBonus,
    balanceBefore: 0,
    balanceAfter: referralBonus,
    description: `Bonus parrainage`,
  });

  await User.findByIdAndUpdate(referrer._id, {
    $inc: { referralCount: 1 }
  });
}

const token = generateToken(user._id);

res.status(201).json({
  token,
  user: user.toSafeObject(),
  bonusApplied: referralBonus || null
});


} catch (err) {
res.status(500).json({ message: 'Erreur serveur' });
}
});

// ── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', authLimiter, [
body('phone').matches(/^\d{8}$/),
body('password').notEmpty(),
], async (req, res) => {

const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

try {
const { phone, password, fingerprint } = req.body;


const user = await User.findOne({ phone });
if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

const isMatch = await user.comparePassword(password);
if (!isMatch) return res.status(401).json({ message: 'Identifiants invalides' });

if (!user.isActive) {
  return res.status(403).json({ message: 'Compte désactivé' });
}

// ❌ check banned device
const banned = await User.findOne({ fingerprint, isBanned: true });
if (banned) {
  return res.status(403).json({ message: "Appareil bloqué ❌" });
}

// 🔥 نحفظ fingerprint إذا أول مرة
if (!user.fingerprint) {
  user.fingerprint = fingerprint;
  await user.save();
}

const token = generateToken(user._id);

res.json({
  token,
  user: user.toSafeObject()
});


} catch (err) {
res.status(500).json({ message: 'Erreur serveur' });
}
});

module.exports = router;
