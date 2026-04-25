const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:        { type: Number, required: true, min: [1, 'Amount must be > 0'] },
  method:        { type: String, enum: ['D17', 'ORANGE'], default: 'D17' },
  screenshot:    { type: String, required: true },
  screenshotHash:{ type: String, required: true },
  orangeCode:    { type: String, default: null },
  promoCode:     { type: String, default: null },
  promoBonus:    { type: Number, default: 0 },
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:     { type: String, default: null },
  processedAt:   { type: Date, default: null },
  processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

depositSchema.index({ screenshotHash: 1 }, { unique: true });
depositSchema.index({ orangeCode: 1 },     { unique: true, sparse: true });

module.exports = mongoose.model('Deposit', depositSchema);
