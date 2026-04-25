const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  // Payment numbers
  d17Number:    { type: String, default: '' },
  orangeNumber: { type: String, default: '' },
  // Promo system
  promoEnabled:        { type: Boolean, default: true },
  promoBonusOnDeposit: { type: Number, default: 2 },    // TND bonus when using promo at deposit
  referralBonus:       { type: Number, default: 2 },    // TND bonus on registration via referral
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
