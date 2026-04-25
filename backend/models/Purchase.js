const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  pricePaid: { type: Number, required: true },
  status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' }
}, { timestamps: true });

purchaseSchema.index({ userId: 1, ticketId: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
