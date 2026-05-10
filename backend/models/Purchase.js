const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  pricePaid: { type: Number, required: true },
  status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' },
  // Watermark tracking for security
  watermarkData: {
    userName: { type: String, default: '' },
    userPhone: { type: String, default: '' },
    purchasedAt: { type: Date, default: Date.now },
    purchaseId: { type: String, default: '' }
  },
  // View tracking
  viewCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date, default: null }
}, { timestamps: true });

purchaseSchema.index({ userId: 1, ticketId: 1 }, { unique: true });
purchaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
