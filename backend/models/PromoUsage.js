const mongoose = require('mongoose');

// Tracks every time a promo code is used at deposit time
const promoUsageSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  promoCode: { type: String, required: true },
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner of the code
  bonusAmount: { type: Number, required: true },
  depositId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deposit' },
}, { timestamps: true });

// A user can only use any given promo code once
promoUsageSchema.index({ userId: 1, promoCode: 1 }, { unique: true });

module.exports = mongoose.model('PromoUsage', promoUsageSchema);
