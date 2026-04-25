const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'purchase', 'refund'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String },
  reference: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceModel' },
  referenceModel: { type: String, enum: ['Deposit', 'Ticket'] }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
